var Express = require("express");
var disconnect = require("clients/dropbox/disconnect");
var views = __dirname + "/../../views/";
var dashboard = Express.Router();

dashboard.use(require("./loadDropboxAccount"));

// The settings page for a Dropbox account
dashboard.get("/", function (req, res) {
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
  const { code, full_access } = req.query;

  req.session.dropbox = {
    code,
    full_access,
  };

  res.redirect(req.baseUrl + "/preparing");
});

dashboard.use("/preparing", require("./preparing"));

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
