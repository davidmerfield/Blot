const clfdate = require("helper/clfdate");
const database = require("../database");
const disconnect = require("../disconnect");
const express = require("express");
const dashboard = new express.Router();
const establishSyncLock = require("../util/establishSyncLock");
const createDriveClient = require("../serviceAccount/createDriveClient");
const requestServiceAccount = require("clients/google-drive/serviceAccount/request");
const resetFromBlot = require("../sync/resetToDrive");
const parseBody = require("body-parser").urlencoded({ extended: false });

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

dashboard.use(async function (req, res, next) {

  res.locals.account = await database.blog.get(req.blog.id);
  
  if (res.locals.account && res.locals.account.serviceAccountId) {
    res.locals.serviceAccount = await database.serviceAccount.get(res.locals.account.serviceAccountId)
  }

  next();
});

dashboard.get("/", function (req, res) {
  res.render(VIEWS + "index");
});

dashboard
  .route("/disconnect")
  .get(function (req, res) {
    res.render(VIEWS + "disconnect");
  })
  .post(function (req, res, next) {
    disconnect(req.blog.id, next);
  });


dashboard.route("/set-up-folder")
    .post(parseBody, async function (req, res, next) {

        if (req.body.cancel){
          return disconnect(req.blog.id, next);
        }

        if (req.body.email) {

          // Determine the service account ID we'll use to sync this blog.
          // We query the database to retrieve all the service accounts, then
          // sort them by the available space (storageQuota.available - storageQuota.used)
          // to find the one with the most available space.
          const serviceAccountId = await requestServiceAccount();

          await database.blog.store(req.blog.id, {
            email: req.body.email,
            serviceAccountId,
            error: null,
            preparing: true
          });

          setUpBlogFolder(serviceAccountId, req.blog, req.body.email);
        }

        console.log(clfdate(), "Google Drive Client", "Setting up folder");
        res.redirect(req.baseUrl);
    });

dashboard.post("/cancel", async function (req, res) {

    console.log(clfdate(), "Google Drive Client", "Cancelling folder setup");
  
      await database.blog.delete(req.blog.id);
  
      res.message(req.baseUrl, "Cancelled the creation of your new folder");
  });


const setUpBlogFolder = async function (serviceAccountId, blog, email) {

  let done;

  try {
    const checkWeCanContinue = async () => {
      const { preparing } = await database.blog.get(blog.id);
      if (!preparing) throw new Error("Permission to set up revoked");
    };

    let sync = await establishSyncLock(blog.id);

    // we need to hoist this so we can call it in the catch block
    done = sync.done;

    sync.folder.status("Establishing connection to Google Drive");
    const drive = await createDriveClient(serviceAccountId);

    // var fileMetadata = {
    //   name: blog.title.split("/").join("").trim(),
    //   mimeType: "application/vnd.google-apps.folder"
    // };

    let folderId;
    let folderName;

    sync.folder.status("Waiting for folder to be created");

    // Must be a new folder created after the current time
    const after = new Date(Date.now()).toISOString();

    do {
      await checkWeCanContinue();
      const res = await findEmptySharedFolder(drive, email, after);

      // wait 3 seconds before trying again
      if (!res) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        continue;
      } else {
        folderId = res.folderId;
        folderName = res.folderName;
      }
    } while (!folderId);

    await database.blog.store(blog.id, { folderId, folderName });

    await checkWeCanContinue();
    sync.folder.status("Ensuring new folder is in sync");
    await resetFromBlot(blog.id, sync.folder.status);

    // await checkWeCanContinue();
    // sync.folder.status("Setting up webhook");
    // await setupWebhook(blog.id, folderId);

    await database.blog.store(blog.id, { preparing: false });
    sync.folder.status("All files transferred");
    done(null, () => {});
  } catch (e) {
    console.log(clfdate(), "Google Drive Client", e);

    let error = "Failed to set up account";

    if (e.message === "Permission to set up revoked") {
      error = null;
    }

    if (e.message === "Please share an empty folder") {
      error = "Please share an empty folder";
    }

    await database.blog.store(blog.id, {
      error,
      preparing: null,
      folderId: null,
      folderName: null
    });

    if (done) done(null, () => {});
  }
};

/**
 * List the contents of root folder.
 */
async function findEmptySharedFolder(drive, email, after) {

  // List all shared folders owned by the given email created after the given date
  const res = await drive.files.list({
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    q: `'${email}' in owners and trashed = false and mimeType = 'application/vnd.google-apps.folder' and createdTime > '${after}'`,
  });

  if (res.data.files.length === 0) {
    return null;
  }

  if (res.data.files.length === 1) {
    // Handle the case where there is only one folder
    const folder = res.data.files[0];

    // List the contents of the folder
    const folderContents = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: `'${folder.id}' in parents and trashed = false`,
    });

    if (folderContents.data.files.length > 0) {
      // If the folder is non-empty, throw an error
      throw new Error("Please share an empty folder");
    } else {
      // If the folder is empty, return it
      return { folderId: folder.id, folderName: folder.name };
    }
  }

  // Handle the case where there are multiple folders
  for (const folder of res.data.files) {

    // List the contents of the current folder
    const folderContents = await drive.files.list({
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      q: `'${folder.id}' in parents and trashed = false`,
    });

    // If the folder is empty, return it
    if (folderContents.data.files.length === 0) {
      return { folderId: folder.id, folderName: folder.name };
    }
  }

  // If no empty folder is found, wait and retry
  return null;
}

module.exports = dashboard;
