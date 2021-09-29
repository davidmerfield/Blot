const bodyParser = require("body-parser");
const express = require("express");
const dashboard = new express.Router();

dashboard
  .route("/webhook")
  .get(function (req, res) {
    res.send("GET OK!");
  })
  .post(bodyParser.urlencoded({ extended: false }))
  .post(function (req, res, next) {
    // sync(req.blog.id, { fromScratch: req.query.fromScratch }, function (err) {
    //   if (err) return next(err);
    //   res.message("/settings/client/google-drive", "Success!");
    // });
    console.log('headers', req.headers);
    console.log('body:', req.body);
    console.log('params:', req.params);
    console.log('query:', req.query);
    res.send("POST OK!");
  });

module.exports = dashboard;
