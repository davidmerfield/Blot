const Express = require("express");
const templates = new Express.Router();
const config = require("config");
const fs = require("fs-extra");
const Blog = require("models/blog");
const localPath = require("helper/localPath");

const folderForTemplate = {
  blog: "bjorn",
  magazine: "magazine",
  photo: "bjorn",
  portfolio: "bjorn",
  reference: "ferox",
};

templates.get("/:template", function (req, res, next) {
  res.locals.title += " template";
  res.locals.folder = folderForTemplate[req.params.template];

  res.locals.folderPreview = {};

  res.locals.preview =
    config.protocol +
    "preview-of-" +
    req.params.template +
    "-on-" +
    res.locals.folder +
    "." +
    config.host;

  next();
});

templates.get("/:template", function (req, res, next) {
  Blog.get({ handle: folderForTemplate[req.params.template] }, function (
    err,
    blog
  ) {
    if (err || !blog) return next(err);
    fs.readdir(localPath(blog.id, "/"), function (err, contents) {
      if (err) return next(err);
      res.locals.folderPreview.contents = contents.map((i) => {
        return { name: i };
      });
      next();
    });
  });
});

module.exports = templates;
