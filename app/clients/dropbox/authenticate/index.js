var authenticate = require("express").Router();
var debug = require("debug")("clients:dropbox:authenticate");
var config = require("config");
var Dropbox = require("dropbox").Dropbox;
var database = require("../database");

var token = require("./token");
var createFolder = require("./createFolder");
var dropboxAccount = require("./dropboxAccount");
var checkAppFolder = require("./checkAppFolder");
var writeExistingContents = require("./writeExistingContents");
var moveExistingFiles = require("./moveExistingFiles");

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
authenticate
  .route("/")
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

authenticate.route("/setup").get(function(req, res) {
  res.render(__dirname + "/../views/authenticate.html", { title: "Dropbox" });
});

// This is called when the user has configured another
// blog to the user their app folder, and wants to add
// this blog to it. We move the existing files into
// a subfolder in the app folder, then write any existing
// files to the
authenticate
  .route("/migrate")
  .all(checkUnsavedAccount)
  .get(function(req, res) {
    res.render(__dirname + "/../views/migrate.html", {
      title: "Migrate Dropbox"
    });
  })
  .post(
    checkAppFolder,
    moveExistingFiles,
    createFolder,
    writeExistingContents,
    saveDropboxAccount
  );

// This route sends the user to Dropbox
// to consent to Blot's connection.
authenticate.route("/redirect").get(function(req, res) {
  var callback, key, secret, authentication_url;

  callback = req.protocol + "://" + req.get("host") + req.baseUrl;

  if (req.query.full_access) {
    key = config.dropbox.full.key;
    secret = config.dropbox.full.secret;
    callback += "?full_access=true";
  } else {
    key = config.dropbox.app.key;
    secret = config.dropbox.app.secret;
  }

  var client = new Dropbox({
    clientId: key,
    secret: secret
  });

  authentication_url = client.getAuthenticationUrl(callback, null, "code");
  authentication_url = authentication_url.replace(
    "response_type=token",
    "response_type=code"
  );

  debug("Redirecting", req.blog.id, "authentication_url");

  res.redirect(authentication_url);
});

function checkUnsavedAccount(req, res, next) {
  if (!req.session.unsavedAccount) return next(new Error("No account"));

  req.unsavedAccount = req.session.unsavedAccount;
  next();
}

function askToMigrateIfNeeded(req, res, next) {
  if (req.otherBlogUsingEntireAppFolder) {
    req.session.unsavedAccount = req.unsavedAccount;
    res.redirect(req.baseUrl + "/migrate");
  } else {
    next();
  }
}
function saveDropboxAccount(req, res, next) {
  database.set(req.blog.id, req.unsavedAccount, function(err) {
    if (err) return next(err);

    res.message("/", "Set up Dropbox successfuly!");
  });
}
module.exports = authenticate;
