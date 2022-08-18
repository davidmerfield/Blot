const express = require("express");
const preparing = express.Router();
const views = __dirname + "/../../../views";
const sync = require("sync");

preparing
  .route("/")
  .get(function (req, res, next) {
    res.render(views + "/preparing");

    if (req.session.dropbox.preparing === true) {
      return;
    }

    req.session.dropbox.preparing = true;

    sync(req.blog.id, function (err, folder, done) {
      if (err) return next(err);

      req.done = done;
      req.folder = folder;
      next();
    });
  })
  .get(require("./token"))
  .get(require("./dropboxAccount"))
  .get(require("./checkAppFolder"))
  .post(require("./moveExistingFiles"))
  .get(require("./createFolder"))
  .get(require("./saveDropboxAccount"))
  .get(require("./writeExistingContents"))
  .get(function (req, res) {
    // The front-end listens for this message, so if you change it
    // also update views/preparing.html
    req.folder.status("Finished setting up your blog folder on Dropbox");
  })
  // If we encounter some error during
  // the authentication flow, send them
  // back to the setup page where they started
  .get(function (err, req, res, next) {
    console.log("here with err", err);
    if (req.done) {
      req.done(err, next);
    } else {
      next(err);
    }
    // res.message(req.baseUrl + "/setup", err);
  });

module.exports = preparing;
