const clfdate = require("helper/clfdate");
const database = require("../database");
const disconnect = require("../disconnect");
const express = require("express");
const dashboard = new express.Router();
const establishSyncLock = require("../util/establishSyncLock");
const createDriveClient = require("../util/createDriveClient");
const setupWebhook = require("../util/setupWebhook");
const resetFromBlot = require("../sync/reset-from-blot");
const parseBody = require("body-parser").urlencoded({ extended: false });

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

dashboard.use(async function (req, res, next) {
  const account = await database.getAccount(req.blog.id);
  res.locals.blot_googledrive_client_email = process.env.BLOT_GOOGLEDRIVE_CLIENT_EMAIL;
  res.locals.account = account;

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
        console.log('req.body', req.body);

        if (req.body.cancel){
            return disconnect(req.blog.id, next);
        }

        if (req.body.email) {
            await database.setAccount(req.blog.id, {
                email: req.body.email,
                preparing: true
            });

            setUpBlogFolder(req.blog, req.body.email);
        }

        console.log(clfdate(), "Google Drive Client", "Setting up folder");
        res.redirect(req.baseUrl);
    });

dashboard
  .route("/set-up-folder/cancel")
  .all(function (req, res, next) {
    if (!res.locals.account.preparing) return res.redirect(req.baseUrl);
    next();
  })
  .get(function (req, res) {
    res.render(VIEWS + "set-up-folder-cancel");
  })
  .post(async function (req, res) {
    await database.setAccount(req.blog.id, {
      error: null,
      channel: null,
      folderId: null,
      folderName: null,
      preparing: null
    });
    res.message(req.baseUrl, "Cancelled the creation of your new folder");
  });


const setUpBlogFolder = async function (blog, email) {
  let releaseLock;
  try {
    const checkWeCanContinue = async () => {
      const { preparing } = await database.getAccount(blog.id);
      if (!preparing) throw new Error("Permission to set up revoked");
    };

    const { folder, done } = await establishSyncLock(blog.id);
    releaseLock = done;
    const publish = folder.status;

    publish("Establishing connection to Google Drive");
    const drive = await createDriveClient(blog.id);

    // var fileMetadata = {
    //   name: blog.title.split("/").join("").trim(),
    //   mimeType: "application/vnd.google-apps.folder"
    // };

    await checkWeCanContinue();
    publish("Waiting for folder to be created");

    const {folderId, folderName} = await waitForSharedFolder(drive, email);
    
    // const blogFolder = await drive.files.create({
    //   resource: fileMetadata,
    //   fields: "id, name"
    // });

    // const folderId = blogFolder.data.id;

    await database.setAccount(blog.id, { folderId, folderName });

    await checkWeCanContinue();
    publish("Ensuring new folder is in sync");
    await resetFromBlot(blog.id, publish);

    await checkWeCanContinue();
    publish("Setting up webhook");
    await setupWebhook(blog.id);

    await database.setAccount(blog.id, { preparing: null });
    publish("All files transferred");
    done(null, () => {});
  } catch (e) {
    console.log(clfdate(), "Google Drive Client", e);

    let error = "Failed to set up account";

    if (e.message === "Permission to set up revoked") {
      error = null;
    }

    await database.setAccount(blog.id, {
      error,
      preparing: null,
      channel: null,
      folderId: null,
      folderName: null
    });

    if (releaseLock) releaseLock();
  }
};

/**
 * List the contents of root folder.
 */
async function waitForSharedFolder(drive, email) {
    try {
      console.log('Listing root folder contents...' + email);
      const res = await drive.files.list({
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        q: `'${email}' in owners and trashed = false and mimeType = 'application/vnd.google-apps.folder'`,
      });
  
      if (res.data.files.length === 0) {
        console.log('No shared folder found.... waiting 3 seconds and trying again ' + email);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return waitForSharedFolder(drive, email);
      }
  
      const folderId = res.data.files[0].id;
      console.log(`Shared folder found with ID: ${folderId}`);
      return { folderId, folderName: res.data.files[0].name };
    } catch (error) {
      console.error('Error listing folder contents:', error.message);
    }
  }

module.exports = dashboard;
