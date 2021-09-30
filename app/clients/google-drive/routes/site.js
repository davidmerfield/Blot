const express = require("express");
const dashboard = new express.Router();
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const sync = require("../sync");
const clfdate = require("helper/clfdate");

dashboard.route("/authenticate").get(function (req, res) {
  res.redirect(
    config.protocol +
      config.host +
      "/settings/client/google-drive/authenticate?" +
      querystring.stringify(req.query)
  );
});

dashboard
  .route("/webhook")
  .get(function (req, res) {
    res.send("GET OK!");
  })
  .post(function (req, res) {
    console.log(clfdate(), "Google Drive client received webhook");
    if (req.headers["x-goog-channel-token"]) {
      const token = querystring.parse(req.headers["x-goog-channel-token"]);

      const signature = hash(
        token.blogID + req.headers["x-goog-channel-id"] + config.session.secret
      );

      if (token.signature !== signature) {
        return console.log(
          clfdate(),
          "Google Drive client received webhook with bad signature"
        );
      }

      console.log(
        clfdate(),
        "Blog:",
        token.blogID,
        "Google Drive client received webhook, starting sync..."
      );
      sync(token.blogID, { fromScratch: false }, function (err) {
        if (
          err &&
          err.message.startsWith("Exceeded 1 attempts to lock the resource")
        ) {
          console.error(
            clfdate(),
            "Blog:",
            token.blogID,
            "Google Drive client ran into another process currently syncing this blog, abort!"
          );
        } else if (err) {
          console.error(
            clfdate(),
            "Blog:",
            token.blogID,
            "Error syncing with Google Drive",
            err
          );
        } else {
          console.error(
            clfdate(),
            "Blog:",
            token.blogID,
            "Google Drive client completed sync without error",
            err
          );
        }
      });
    }

    res.send("POST OK!");
  });

module.exports = dashboard;
