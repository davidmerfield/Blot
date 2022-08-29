const _ = require("lodash");
const moment = require("moment");
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const sync = require("../sync");
const clfdate = require("helper/clfdate");
const database = require("../database");
const express = require("express");
const site = new express.Router();
const session = require("dashboard/session");

// Customers are sent back to:
// blot.im/clients/google-drive/authenticate
// when they have authorized (or declined to authorize)
// Blot's access to their folder. This is a public-facing
// route without access to the customer's session by default.
// We need to work out which blog they were
// authenticating based on a value stored in their session
// before they were sent out to Google Drive. Unfortunately we
// can't pass a blog username in the URL, since it needs to
// be the same URL every time, e.g. this would not work:
// blot.im/clients/google-drive/authenticate?handle=david

// Additionally, in development mode, we are:
// first sent back to:
// tunnel.blot.im/clients/google-drive/authenticate
// are then redirected to:
// blot.development/clients/google-drive/authenticate
// and finally redirected to:
// blot.development/dashboard/*/client/google-drive/authenticate
site.get("/authenticate", session, function (req, res) {
  // This means we hit the public routes on Blot's site
  if (req.session.blogToAuthenticate) {
    const url =
      config.protocol +
      config.host +
      "/dashboard/" +
      req.session.blogToAuthenticate +
      "/client/google-drive/authenticate?" +
      querystring.stringify(req.query);
    delete req.session.blogToAuthenticate;
    res.redirect(url);
  // This means we hit the public routes on Blot's webhook
  // forwarding host (e.g. tunnel.blot.im) we don't have access
  // to the session info yet so we redirect to the public routes
  // on Blot's site, which will be able to access the session.
  } else {
    const url =
      config.protocol +
      config.host +
      "/clients/google-drive/authenticate?" +
      querystring.stringify(req.query);
    res.redirect(url);
  }
});

site
  .route("/webhook")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(async function (req, res) {
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

      const account = await database.getAccount(token.blogID);

      const channel = {
        kind: "api#channel",
        id: req.headers["x-goog-channel-id"],
        resourceId: req.headers["x-goog-resource-id"],
        resourceUri: req.headers["x-goog-resource-uri"],
        token: req.headers["x-goog-channel-token"],
        expiration: moment(req.headers["x-goog-channel-expiration"])
          .valueOf()
          .toString(),
      };

      // When for some reason we can't stop the old webhook
      // for this blog during an account disconnection we sometimes
      // recieve webhooks on stale channels. This can tank the setup
      // of the blog on Google Drive and happens in my dev env.
      // We can't call drive.stop on the stale channel since the
      // refresh_token likely changed, just let it expire instead.
      if (!_.isEqual(channel, account.channel)) {
        return console.error(
          prefix(),
          "Mismatch between recieved channel and stored account.channel"
        );
      }

      sync(token.blogID, { fromScratch: false }, function (err) {
        if (err) {
          console.error(prefix(), token.blogID, "Error:", err);
        } else {
          console.log(prefix(), "Completed sync without error", token.blogID);
        }
      });
    }

    res.send("OK");
  });

module.exports = site;
