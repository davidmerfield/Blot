const express = require("express");
const site = express.Router();

// This is called by Dropbox when changes
// are made to the folder of a Blot user.
site.use("/webhook", require("./webhook"));

// This is called by Dropbox when the user
// authorizes Blot's access to their folder
// as part of the OAUTH flow. We then redirect
// them to a dashboard route within the Dropbox client
site.use("/authenticate", require("./authenticate"));

module.exports = site;
