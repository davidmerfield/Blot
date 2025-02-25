const clfdate = require("helper/clfdate");
const database = require("../database");
const disconnect = require("../disconnect");
const express = require("express");
const dashboard = new express.Router();
const parseBody = require("body-parser").urlencoded({ extended: false });

const VIEWS = require("path").resolve(__dirname + "/../views") + "/";

dashboard.use(async function (req, res, next) {
  res.locals.account = await database.get(req.blog.id);
  next();
});

dashboard.get("/", function (req, res) {
  res.render(VIEWS + "index");
});

dashboard
  .route("/disconnect")
  .get(function (req, res) {
    res.render(VIEWS + "disconnect");
  })
  .post(function (req, res, next) {
    disconnect(req.blog.id, next);
  });

dashboard.route("/set-up-folder")
    .post(parseBody, async function (req, res, next) {

        if (req.body.cancel){
          return disconnect(req.blog.id, next);
        }

        if (req.body.sharingLink) {
            await database.store(req.blog.id, {sharingLink: req.body.sharingLink});
        }

        res.redirect(req.baseUrl);
    });

dashboard.post("/cancel", async function (req, res) {  

    await database.blog.delete(req.blog.id);
  
    res.message(req.baseUrl, "Cancelled the creation of your new folder");
});

module.exports = dashboard;
