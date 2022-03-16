var Express = require("express");
var setup = require("./setup");
var disconnect = require("./disconnect");
var HOME_DIR = require("os").homedir();

// It's important this is an Express router
// and not an Express app for reasons unknown
var Dashboard = Express.Router();

// By the time this middleware is mounted, blot
// has fetched the information about this user.
Dashboard.get("/", function (req, res, next) {
  res.render(__dirname + "/views/index.html");
});

Dashboard.post("/disconnect", function (req, res, next) {
  disconnect(req.blog.id, next);
});

module.exports = Dashboard;
