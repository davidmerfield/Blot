const config = require("config");
const hash = require("helper/hash");
const clfdate = require("helper/clfdate");
const express = require("express");
const site = new express.Router();

const sync = require("clients/google-drive/sync");
const database = require("clients/google-drive/database");


site
  .route("/webhook/test")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(async function (req, res) {
    const prefix = () => clfdate() + " Google Drive:";
    const token = req.header("x-goog-channel-token");
    const channelID = req.header("x-goog-channel-id");
    
    console.log(prefix(), token, "Received");
    res.send("OK!");
  });


site
  .route("/webhook/changes")
  .get(function (req, res) {
    res.send("Ok!");
  })
  .post(async function (req, res) {
    res.send("OK");
    // const prefix = () => clfdate() + " Google Drive:";
    // const token = req.header("x-goog-channel-token");
    // const channelID = req.header("x-goog-channel-id");

    // if (!token) return res.status(400).send("Missing header: x-goog-channel-token");
    // if (!channelID) return res.status(400).send("Missing header: x-goog-channel-id");

    // const storedChannel = await database.serviceAccount.getByChannelId(channelID);

    // // When for some reason we can't stop the old webhook
    // // for this blog during an account disconnection we sometimes
    // // recieve webhooks on stale channels. This can tank the setup
    // // of the blog on Google Drive and happens in my dev env.
    // // We can't call drive.stop on the stale channel since the
    // // refresh_token likely changed, just let it expire instead.
    // if (!storedChannel) {
    //     console.log(prefix(), "Stale channel, ignoring", channelID);
    //     return res.send("OK");
    // }

    // const signature = hash(storedChannel.id + config.google_drive.webhook_secret);

    // if (token !== signature) {
    //   console.log(prefix(), "Invalid signature", token, signature);
    //   return res.status(400).send("Invalid signature");
    // }
    

    // res.send("OK");

    // const blogs = await database.serviceAccount.listBlogs(storedChannel.id);

    // for (const blog of blogs) {
    //   try {
    //       console.log(prefix(), blog.id, "Received webhook begin sync");
    //       await sync(blog.id);
    //   } catch (e) {
    //       console.error(prefix(), blog.id, "Error during sync", e);
    //   }
    // }
  });

module.exports = site;
