const express = require("express");
const paypal = new express.Router();
const parser = require("body-parser");

paypal.post("/", parser.json(), (req, res) => {
  console.log("UNTRUSTED WEBHOOK PAYLOAD", req.body);

  // we basically fetch the subscription from paypal and restore it in the db
  res.status(200).send("OK");
});

module.exports = paypal;
