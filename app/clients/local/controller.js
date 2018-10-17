var Express = require("express");
var model = require("./model");
var sync = require("./sync");
var fs = require("fs-extra");

// It's important this is an Express router
// and not an Express app for reasons unknown
var controller = Express.Router();

// By the time this middleware is mounted, blot
// has fetched the information about this user.
controller.get("/", function(req, res, next) {
  model.get(req.blog.id, function(err, folder) {
    if (err) return next(err);

    res.render(__dirname + "/view.html", { userFolder: folder });
  });
});

controller.post("/set", function(req, res, next) {
  if (!req.body.name || !req.body.name.trim())
    return next(new Error("Please pass a folder name"));

  var folder = require("os").homedir() + "/" + req.body.name.trim();

  fs.ensureDir(folder, function(err) {
    if (err) return next(err);

    model.set(req.blog.id, folder, function(err) {
      if (err) return next(err);

      sync(req.blog.id, folder, function(err) {
        if (err) return next(err);

        res.redirect(req.baseUrl);
      });
    });
  });
});

controller.post("/disconnect", function(req, res, next) {
  require("./disconnect")(req.blog.id, next);
});

module.exports = controller;
