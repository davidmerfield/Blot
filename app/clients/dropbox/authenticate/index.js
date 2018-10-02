var debug = require("debug")("clients:dropbox:authenticate");
var get_account = require("./get_account");
var set_account = require("./set_account");
var prepare_folder = require("./prepare_folder");
var authenticate = require("express").Router();
var write_existing_contents = require("./write_existing_contents");
var lock_on_folder = require("./lock_on_folder");
var redirect = require("./redirect");

// This route sends the user to Dropbox
// to consent to Blot's connection.
authenticate.route("/redirect").get(redirect);

// This route recieves the user back from
// Dropbox when they have accepted or denied
// the request to access their folder.
authenticate
  .route("/")
  .get(
    lock_on_folder.acquire,
    get_account,
    prepare_folder,
    write_existing_contents,
    set_account,
    lock_on_folder.release
  );

authenticate.use(function(req, res) {
  // Release sync lease
  if (req.on_complete) {
    debug("Calling sync on_complete in non-error handler!");
    req.on_complete();
  }

  res.message("/", "Authentication to Dropbox successful!");
});

// Error handler
authenticate.use(function(err, req, res, next) {
  if (req.on_complete) {
    debug("Calling sync on_complete in error handler!");
    req.on_complete();
  }

  if (err.message) {
    res.message({ error: err.message, url: req.baseUrl });
    debug(req.baseUrl, req.url, req.path);
    return res.redirect(req.baseUrl);
  }

  debug("error here", err);
  next(err);
});

module.exports = authenticate;
