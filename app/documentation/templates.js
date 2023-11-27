const Express = require("express");
const templates = new Express.Router();
const config = require("config");
const fs = require("fs-extra");
const Blog = require("models/blog");
const localPath = require("helper/localPath");

const folderForTemplate = {
  blog: "david",
  magazine: "interviews",
  photo: "william",
  portfolio: "bjorn",
  reference: "frances",
};

templates.get('/', (req, res, next)=>{
  res.locals.fullWidth = true;
  next();
})

templates.get("/:template", require("./featured"));

templates.get("/:template", function (req, res, next) {
  res.locals.featured = res.locals.featured
    .filter((i) => i.template.slug === req.params.template)
    .slice(0, 5);

  if (res.locals.featured.length < 2) delete res.locals.featured;

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
      res.locals.folderPreview.contents = contents
        .filter((i) => i[0] !== ".")
        .map((i) => {
          let type = i.indexOf(".") > -1 ? "file" : "folder";

          if (
            i.toLowerCase().endsWith("jpg") ||
            i.toLowerCase().endsWith("png")
          ) {
            type += " img";
          } else {
            type += " txt";
          }

          return { name: i, type };
        })
        .slice(0, 6);

      next();
    });
  });
});

module.exports = templates;
