var Express = require("express");
var views = __dirname + "/views/";
var disconnect = require("../disconnect");

// Middleware
var token = require("./token");
var createFolder = require("./createFolder");
var dropboxAccount = require("./dropboxAccount");
var checkAppFolder = require("./checkAppFolder");
var writeExistingContents = require("./writeExistingContents");
var moveExistingFiles = require("./moveExistingFiles");
var loadDropboxAccount = require("./loadDropboxAccount");
var askToMigrateIfNeeded = require("./askToMigrateIfNeeded");
var checkUnsavedAccount = require("./checkUnsavedAccount");
var saveDropboxAccount = require("./saveDropboxAccount");
var redirect = require("./redirect");

// Exports
var Dashboard = Express.Router();
var Site = Express.Router();

Dashboard.use(loadDropboxAccount);

Dashboard.route("/").get(function(req, res) {
  if (!req.account) return res.redirect(req.baseUrl + "/authenticate/setup");

  res.render(views + "index");
});

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
Dashboard.route("/authenticate")
  .get(
    token,
    dropboxAccount,
    checkAppFolder,
    askToMigrateIfNeeded,
    createFolder,
    writeExistingContents,
    saveDropboxAccount
  )
  .get(function(err, req, res, next) {
    res.message(req.baseUrl + "/setup", err);
  });

Dashboard.route("/redirect").get(redirect);

Dashboard.route("/setup").get(function(req, res) {
  res.render(views + "authenticate");
});

// This is called when the user has configured another
// blog to the user their app folder, and wants to add
// this blog to it. We move the existing files into
// a subfolder in the app folder, then write any existing
// files to the
Dashboard.route("/migrate")
  .all(checkUnsavedAccount)
  .get(function(req, res) {
    res.render(views + "migrate");
  })
  .post(
    checkAppFolder,
    moveExistingFiles,
    createFolder,
    writeExistingContents,
    saveDropboxAccount
  );

Dashboard.route("/permission").get(function(req, res) {
  res.render(views + "permission");
});

Dashboard.route("/disconnect")
  .get(function(req, res) {
    res.render(views + "disconnect");
  })
  .post(function(req, res, next) {
    disconnect(req.blog.id, next);
  });

// This is called by Dropbox when changes
// are made to the folder of a Blot user.
Site.use("/webhook", require("./webhook"));

module.exports = { dashboard: Dashboard, site: Site };
