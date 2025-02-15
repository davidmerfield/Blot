const config = require("config");
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
    const token = req.header("x-goog-channel-token");
    const channelID = req.header("x-goog-channel-id");

    if (!token) return res.status(400).send("Missing header: x-goog-channel-token");
    if (!channelID) return res.status(400).send("Missing header: x-goog-channel-id");

    const storedChannel = await database.channel.get(channelID);

    // When for some reason we can't stop the old webhook
    // for this blog during an account disconnection we sometimes
    // recieve webhooks on stale channels. This can tank the setup
    // of the blog on Google Drive and happens in my dev env.
    // We can't call drive.stop on the stale channel since the
    // refresh_token likely changed, just let it expire instead.
    if (!storedChannel) {
        console.log(prefix(), "Stale channel, ignoring", channelID);
        return res.send("OK");
    }

    if (!storedChannel.blogID) {
      console.log(prefix(), "No blog ID, ignoring", channelID);
      return;
    }

    if (!storedChannel.id) {
      console.log(prefix(), "No channel ID, ignoring", channelID);
      return;
    }

    const signature = hash(storedChannel.blogID + storedChannel.id + config.google_drive.webhook_secret);

    if (token !== signature) {
      console.log(prefix(), "Invalid signature", token, signature);
      return res.status(400).send("Invalid signature");
    }
      
    res.send("OK");

    try {
        console.log(prefix(), storedChannel.blogID, "Received webhook begin sync");
        await sync(storedChannel.blogID);
    } catch (e) {
        console.error(prefix(), storedChannel.blogID, "Error during sync", e);
    }
  });

module.exports = site;
