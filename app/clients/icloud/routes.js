var database = require("./database");
var disconnect = require("./disconnect");
var Express = require("express");
var dashboard = Express.Router();
var site = Express.Router();
var debug = require("debug")("blot:clients:icloud:routes");

dashboard.get("/", function (req, res, next) {
  if (req.query.setup)
    return res.redirect(require("url").parse(req.originalUrl).pathname);

  res.message(req.baseUrl, "Set up iCloud client successfully");
});

dashboard.get("/", function (req, res) {
  database.getToken(req.blog.owner, function (err, token) {
    res.render(__dirname + "/views/index.html", {
      title: "Git",
      token: token,
      host: process.env.BLOT_HOST,
    });
  });
});

dashboard.get("/disconnect", function (req, res) {
  res.render(__dirname + "/views/disconnect.html", {
    title: "Git",
  });
});

dashboard.post("/disconnect", function (req, res, next) {
  req.blog.client = "";
  disconnect(req.blog.id, next);
});

module.exports = { dashboard: dashboard, site: site };
