var Entries = require("models/entries");
var Template = require("models/template");
var Redirects = require("models/redirects");
var Tags = require("models/tags");
var async = require("async");
var Express = require("express");
var Export = new Express.Router();

Export.route("/").get(function (req, res) {
  res.render("account/export", {
    title: "Export your data",
    breadcrumb: "Export",
  });
});

Export.route("/account.json").get(function (req, res, next) {
  var blogs = {};

  async.each(
    req.blogs || [],
    function (blog, nextBlog) {
      var templates = {};

      Template.getTemplateList(blog.id, function (err, res) {
        if (err) return next(err);

        async.each(
          res,
          function (template, nextTemplate) {
            // Don't include Global templates in this file...
            if (template.owner === "SITE") return nextTemplate();

            Template.getAllViews(template.id, function (err, allviews) {
              if (err) return next(err);

              template.views = allviews;
              templates[template.name] = template;

              nextTemplate();
            });
          },
          function () {
            Redirects.list(blog.id, function (err, redirects) {
              Tags.list(blog.id, function (err, tags) {
                Entries.getAll(blog.id, function (entries) {
                  blog.redirects = redirects;
                  blog.entries = entries;
                  blog.tags = tags;
                  blog.templates = templates;

                  blogs[blog.handle] = blog;

                  nextBlog();
                });
              });
            });
          }
        );
      });
    },
    function () {
      var result = {
        user: req.user,
        blogs: blogs,
      };

      res.setHeader("Content-Type", "application/json");
      res.header("Content-disposition", "attachment; filename=Account.json");
      res.send(JSON.stringify(result, null, 2));
    }
  );
});

module.exports = Export;
