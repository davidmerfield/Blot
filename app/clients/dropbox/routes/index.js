var Express = require("express");
var disconnect = require("../disconnect");
var views = __dirname + "/../views/";
var site, dashboard;

// This is called by Dropbox when changes
// are made to the folder of a Blot user.
site = Express.Router();
site.use("/webhook", require("./webhook"));

dashboard = Express.Router();
dashboard.use(require("./loadDropboxAccount"));

// The settings page for a Dropbox account
dashboard.get("/", function(req, res) {
  // Ask to user to authenticate with Dropbox if they have not yet
  if (!req.account) {
    var query = "";
    if (req.query.setup) query = "?setup=true";
    return res.redirect(req.baseUrl + "/setup" + query);
  }

  res.render(views + "index");
});

// Explains to the user what will happen when they authenticate
// then provides them with a link to the dropbox redirect
dashboard.get("/setup", function(req, res) {
  res.render(views + "authenticate");
});

// Redirects the user to the OAuth page on Dropbox.com
dashboard.get("/redirect", require("./redirect"));

// Explains to the user what happens when they change the
// permission they grant to Blot per access to their Dropbox
dashboard.get("/permission", function(req, res) {
  res.render(views + "permission");
});

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
dashboard
  .route("/authenticate")
  .get(require("./token"))
  .get(require("./dropboxAccount"))
  .get(require("./checkAppFolder"))
  .get(require("./askToMigrateIfNeeded"))
  .get(require("./createFolder"))
  .get(require("./saveDropboxAccount"))
  .get(function(req, res, next) {
    res.message(req.baseUrl, "Set up Dropbox successfuly!");

    require("./writeExistingContents")(req, res, function(err) {
      // Headers have been sent at this point, so just log this error
      if (err) console.log("Dropbox authentication error:", err);

      console.log(
        "Blog:",
        req.blog.id,
        "Set up Dropbox client successfully! Full access?",
        req.unsavedAccount.full_access
      );
    });
  })
  // If we encounter some error during
  // the authentication flow, send them
  // back to the setup page where they started
  .get(function(err, req, res, next) {
    res.message(req.baseUrl + "/setup", err);
  });

// This is called when the user has configured another
// blog to the user their app folder, and wants to add
// this blog to it. We move the existing files into
// a subfolder in the app folder, then write any existing
// files to the
dashboard
  .route("/migrate")
  .all(require("./checkUnsavedAccount"))
  .all(require("./checkAppFolder"))
  .get(function(req, res) {
    res.render(views + "migrate", {
      otherBlog: req.otherBlogUsingEntireAppFolder
    });
  })
  .post(require("./moveExistingFiles"))
  .post(require("./createFolder"))
  .post(require("./saveDropboxAccount"))
  .post(function(req, res, next) {
    res.message("/settings", "Set up Dropbox successfuly!");

    // This happens in the background. It would be nice to
    // expose a progress bar in future.
    require("./writeExistingContents")(req, res, function(err) {
      // Headers have been sent at this point, so just log this error
      if (err) console.log("Dropbox authentication error:", err);

      console.log(
        "Blog:",
        req.blog.id,
        "Set up Dropbox client successfully! Full access?",
        req.unsavedAccount.full_access
      );
    });
  });

// Will remove the Dropbox account from the client's database
// and revoke the token if needed.
dashboard
  .route("/disconnect")
  .get(function(req, res) {
    res.render(views + "disconnect");
  })
  .post(function(req, res, next) {
    disconnect(req.blog.id, next);
  });

module.exports = { dashboard: dashboard, site: site };
