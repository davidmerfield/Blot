const _ = require("lodash");
const moment = require("moment");
const config = require("config");
const querystring = require("querystring");
const hash = require("helper/hash");
const clfdate = require("helper/clfdate");
const express = require("express");
const site = new express.Router();

const sync = require("clients/google-drive/sync");
const database = require("clients/google-drive/database");

site
  .route("/webhook")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(async function (req, res) {
    const prefix = () => clfdate() + " Google Drive:";
    const tokenHeader = req.header("x-goog-channel-token");
    const channelID = req.header("x-goog-channel-id");

    if (!tokenHeader) return res.status(400).send("Missing header");

    const token = querystring.parse(tokenHeader);
    const { blogID } = token;
    const signature = hash(blogID + channelID + config.session.secret);

    if (token.signature !== signature)
      return res.status(400).send("Invalid signature");

    const channel = {
      kind: "api#channel",
      id: req.header("x-goog-channel-id"),
      resourceId: req.header("x-goog-resource-id"),
      resourceUri: req.header("x-goog-resource-uri"),
      token: req.header("x-goog-channel-token"),
      expiration: moment(req.header("x-goog-channel-expiration"))
        .valueOf()
        .toString()
    };

    const account = await database.getAccount(blogID);

    // When for some reason we can't stop the old webhook
    // for this blog during an account disconnection we sometimes
    // recieve webhooks on stale channels. This can tank the setup
    // of the blog on Google Drive and happens in my dev env.
    // We can't call drive.stop on the stale channel since the
    // refresh_token likely changed, just let it expire instead.
    if (!account || !_.isEqual(channel, account.channel)) {
        console.log(prefix(), blogID, "Stale channel, ignoring");
        return res.send("OK");
    }

    res.send("OK");

    console.log(prefix(), blogID, "Received webhook begin sync");
    sync(blogID);
  });

module.exports = site;
