var Express = require("express");
var fs = require("fs-extra");
// It's important this is a router and not an Express app
var controller = Express.Router();
var model = require("./model");
var Blog = require("blog");
var sync = require("./sync");

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
  model.unset(req.blog.id, function(err) {
    if (err) return next(err);
    // eventually clients should not need to do this
    Blog.set(req.blog.id, { client: "" }, next);
  });
});

module.exports = controller;
