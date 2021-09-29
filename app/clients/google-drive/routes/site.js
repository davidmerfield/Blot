const express = require("express");
const dashboard = new express.Router();
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const sync = require("../sync");

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
    if (req.headers["x-goog-channel-token"]) {
      const token = querystring.parse(req.headers["x-goog-channel-token"]);

      const signature = hash(
        token.blogID + req.headers["x-goog-channel-id"] + config.session.secret
      );

      if (token.signature !== signature) {
        return console.log("Invalid signature in TOKEN");
      }

      sync(token.blogID, { fromScratch: false }, function (err) {
        if (err) console.log(err);
      });
    }

    res.send("POST OK!");
  });

module.exports = dashboard;
