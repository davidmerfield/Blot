var Express = require("express");

var Folder = require("./models/folder");
var setup = require("./controllers/setup");

// It's important this is an Express router
// and not an Express app for reasons unknown
var Dashboard = Express.Router();

// By the time this middleware is mounted, blot
// has fetched the information about this user.
Dashboard.get("/", function(req, res, next) {
  Folder.get(req.blog.id, function(err, folder) {
    if (err) return next(err);

    res.render(__dirname + "/views/index.html", { userFolder: folder });
  });
});

Dashboard.post("/set", function(req, res, next) {
  if (!req.body.name || !req.body.name.trim())
    return next(new Error("Please pass a folder name"));

  var folder = require("os").homedir() + "/" + req.body.name.trim();

  setup(req.blog.id, folder, function(err) {
    if (err) return next(err);

    res.redirect(req.baseUrl);
  });
});

Dashboard.post("/disconnect", function(req, res, next) {
  require("./controllers/disconnect")(req.blog.id, next);
});

module.exports = Dashboard;
