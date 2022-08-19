var express = require("express");
var dashboard = express.Router();
var disconnect = require("clients/dropbox/disconnect");
var views = __dirname + "/../../views/";
var prepare = require("./prepare");

dashboard.use(require("./loadDropboxAccount"));

// The settings page for a Dropbox account
dashboard.get("/", function (req, res) {
  // Ask to user to authenticate with Dropbox if they have not yet
  if (!req.account) {
    var query = "";
    if (req.query.setup) query = "?setup=true";
    return res.redirect(req.baseUrl + "/setup" + query);
  }

  res.locals.status = req.session.dropbox && req.session.dropbox.status;
  res.locals.stages = JSON.stringify(STAGES);

  res.render(views + "index");
});

// Explains to the user what will happen when they authenticate
// then provides them with a link to the dropbox redirect
dashboard.get("/setup", function (req, res) {
  res.render(views + "authenticate");
});

// Redirects the user to the OAuth page on Dropbox.com
dashboard.get("/redirect", require("./redirect"));

// Explains to the user what happens when they change the
// permission they grant to Blot per access to their Dropbox
dashboard.get("/permission", function (req, res) {
  res.render(views + "permission");
});

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
dashboard.get("/authenticate", function (req, res) {
  // the user has reloaded this page
  if (req.session.dropbox && req.session.dropbox.preparing === true) {
    return res.redirect(req.baseUrl);
  }

  const { code, full_access } = req.query;

  // this the first time the user has visited this page
  req.session.dropbox = { code, full_access, preparing: true };

  prepare(req, res);

  res.redirect(req.baseUrl);
});

// Will remove the Dropbox account from the client's database
// and revoke the token if needed.
dashboard
  .route("/disconnect")
  .get(function (req, res) {
    res.render(views + "disconnect");
  })
  .post(function (req, res, next) {
    disconnect(req.blog.id, next);
  });

module.exports = dashboard;
