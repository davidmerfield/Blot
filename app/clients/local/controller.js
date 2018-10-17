var Express = require("express");
var fs = require("fs-extra");
// It's important this is a router and not an Express app
var controller = Express.Router();
var model = require("./model");
var Blog = require("blog");
var init = require("./init");

// By the time this middleware is mounted, blot
// has fetched the information about this user.
controller.get("/", function(req, res, next) {
  model.get(req.blog.id, function(err, folder) {
    if (err) return next(err);

    res.render(__dirname + "/view.html", { folder: folder });
  });
});

controller.post("/set", function(req, res, next) {
  var folder = req.body.folder;

  folder = folder.trim();

  if (!folder) return next(new Error("Please select a folder"));

  folder = folder || "untitled";

  fs.ensureDir(require("os").homedir() + "/" + folder, function(err) {
    if (err) return next(err);

    model.set(req.blog.id, folder, function(err) {
      if (err) return next(err);

      init(req.blog.id, folder, function(err) {
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
