var Express = require("express");
var Folder = require("./models/folder");
var setup = require("./controllers/setup");
var disconnect = require("./controllers/disconnect");
var HOME_DIR = require("os").homedir();

// It's important this is an Express router
// and not an Express app for reasons unknown
var Dashboard = Express.Router();

// By the time this middleware is mounted, blot
// has fetched the information about this user.
Dashboard.get("/", function(req, res, next) {
  Folder.get(req.blog.id, function(err, folder) {
    if (err) return next(err);

    res.render(__dirname + "/views/index.html", { dir: folder });
  });
});

Dashboard.post("/set", function(req, res, next) {
  if (!req.body.folder || !req.body.folder.trim())
    return next(new Error("Please pass a folder name"));

  var folder = HOME_DIR + "/" + req.body.folder.trim();

  setup(req.blog.id, folder, function(err) {
    if (err) return next(err);

    res.redirect(req.baseUrl);
  });
});

Dashboard.post("/disconnect", function(req, res, next) {
  disconnect(req.blog.id, next);
});

module.exports = Dashboard;
