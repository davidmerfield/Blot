const express = require("express");
const site = new express.Router();

site
  .route("/webhook/ping")
  .post(async function (req, res) {
    res.send("pong");
    });

module.exports = site;
