const express = require("express");
const dashboard = new express.Router();
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const sync = require("../sync");
const clfdate = require("helper/clfdate");

const LOCK_ERROR = "Exceeded 1 attempts to lock the resource";

// This is only neccessary in a development environment
// when using the webhook forwarding server.
dashboard.get("/authenticate", function (req, res) {
  const url =
    config.protocol +
    config.host +
    "/settings/client/google-drive/authenticate?" +
    querystring.stringify(req.query);

  res.redirect(url);
});

dashboard
  .route("/webhook")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(function (req, res) {
    const prefix = () => clfdate() + " Google Drive:";

    console.log(prefix(), "Received webhook");

    if (req.headers["x-goog-channel-token"]) {
      const token = querystring.parse(req.headers["x-goog-channel-token"]);

      const signature = hash(
        token.blogID + req.headers["x-goog-channel-id"] + config.session.secret
      );

      if (token.signature !== signature) {
        return console.error(prefix(), "Webhook has bad signature");
      }

      console.log(prefix(), "Webhook is valid, starting sync...");

      sync(token.blogID, { fromScratch: false }, function (err) {
        if (err && err.message.startsWith(LOCK_ERROR)) {
          console.error(
            prefix(),
            "Could not acquire lock on folder",
            token.blogID
          );
        } else if (err) {
          console.error(prefix(), token.blogID, "Error:", err);
        } else {
          console.log(prefix(), "Completed sync without error", token.blogID);
        }
      });
    }

    res.send("OK");
  });

module.exports = dashboard;
