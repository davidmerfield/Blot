const config = require("config");
const google = require("googleapis").google;
const clfdate = require("helper/clfdate");
const database = require("../database");
const disconnect = require("../disconnect");
const resetFromBlot = require("../sync/reset-from-blot");
const createDriveClient = require("../util/createDriveClient");
const setupWebhook = require("../util/setupWebhook");
const express = require("express");
const dashboard = new express.Router();
const establishSyncLock = require("../util/establishSyncLock");

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

const REDIRECT_URL =
  config.environment === "development"
    ? `https://${config.webhooks.relay_host}/clients/google-drive/authenticate`
    : `https://${config.host}/clients/google-drive/authenticate`;

dashboard.use(async function (req, res, next) {
  const account = await database.getAccount(req.blog.id);

  if (account && account.folderPath)
    account.folderParents = account.folderPath
      .split("/")
      .slice(1)
      .map((name, i, arr) => {
        return { name, last: arr.length - 1 === i };
      });

  res.locals.account = account;
  next();
});

dashboard.get("/", function (req, res) {
  res.render(VIEWS + "index");
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
      folderPath: null,
      preparing: null
    });
    res.message(req.baseUrl, "Cancelled the creation of your new folder");
  });

dashboard
  .route("/disconnect")
  .get(function (req, res) {
    res.render(VIEWS + "disconnect");
  })
  .post(function (req, res, next) {
    disconnect(req.blog.id, next);
  });

dashboard.get("/redirect", function (req, res) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.drive.key,
    config.google.drive.secret,
    REDIRECT_URL
  );

  // It's important that sameSite is set to false so the
  // cookie is exposed to us when OAUTH redirect occurs
  res.cookie("blogToAuthenticate", req.blog.handle, {
    domain: "",
    path: "/",
    secure: true,
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: "Lax" // otherwise we will not see it
  });

  res.redirect(
    oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: "https://www.googleapis.com/auth/drive",
      // Prompt: consent forces us to revisit the consent
      // screen even if we had previously authorized Blot.
      // This is neccessary to connect multiple blogs under
      // one google account to Drive. More discussion here:
      // https://github.com/googleapis/google-api-python-client/issues/213
      prompt: "consent"
    })
  );
});

dashboard.get("/authenticate", function (req, res) {
  if (!req.query.code) {
    return res.message(
      req.baseUrl,
      new Error("Please authorize Blot to access your Google Drive")
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    config.google.drive.key,
    config.google.drive.secret,
    REDIRECT_URL
  );

  // This will provide an object with the access_token and refresh_token.
  // Save these somewhere safe so they can be used at a later time.
  oauth2Client.getToken(req.query.code, async function (err, credentials) {
    if (err) {
      return res.message(req.baseUrl, err);
    }

    const { refresh_token, access_token, expiry_date } = credentials;

    if (!refresh_token) {
      return res.message(
        req.baseUrl,
        new Error(
          "Missing refresh_token from Google Drive. This probably happened because you had previously connected Blot with Google Drive. Please remove Blot on your Google Account permissions page."
        )
      );
    }

    await database.setAccount(req.blog.id, {
      refresh_token,
      access_token,
      expiry_date
    });

    try {
      const { drive } = await createDriveClient(req.blog.id);
      let email;
      let permissionId;
      const response = await drive.about.get({ fields: "*" });

      email = response.data.user.emailAddress;

      // The user's ID as visible in the permissions collection.
      // https://developers.google.com/drive/api/v2/reference/about#resource
      // we use this to work out if another blog is connected
      // to this google drive account during disconnection so we
      // can determine whether or not to revoke the refresh_token
      // which happens globally and would affect other blogs. We could
      // use the email address but it seems like the ID is more robust
      // since I suppose the user could change their email address...
      permissionId = response.data.user.permissionId;

      // If we are re-authenticating because of an error
      // then remove the error message!
      await database.setAccount(req.blog.id, {
        email,
        permissionId,
        error: ""
      });
    } catch (e) {
      console.log("Error getting info");
      await database.setAccount(req.blog.id, { error: e.message });
      return res.redirect(req.baseUrl);
    }

    const account = await database.getAccount(req.blog.id);

    res.message(req.baseUrl, "Connected to Google Drive");

    try {
      if (!account.folderId) {
        await database.setAccount(req.blog.id, { preparing: true });
        await setUpBlogFolder(req.blog);
      } else {
        await resetFromBlot(req.blog.id);
        await setupWebhook(req.blog.id);
      }
    } catch (e) {
      await database.setAccount(req.blog.id, {
        error: "Could not set up webhooks",
        channel: null,
        folderId: null,
        folderPath: null
      });
    }
  });
});

const setUpBlogFolder = async function (blog) {
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
    const { drive } = await createDriveClient(blog.id);

    var fileMetadata = {
      name: blog.title.split("/").join("").trim(),
      mimeType: "application/vnd.google-apps.folder"
    };

    await checkWeCanContinue();
    publish("Creating new folder");
    const blogFolder = await drive.files.create({
      resource: fileMetadata,
      fields: "id, name"
    });

    const folderId = blogFolder.data.id;
    const folderPath = "/My Drive/" + blogFolder.data.name;

    await database.setAccount(blog.id, {
      folderId: folderId,
      folderPath: folderPath
    });

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
      folderPath: null
    });

    if (releaseLock) releaseLock();
  }
};

module.exports = dashboard;
