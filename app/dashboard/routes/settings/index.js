var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var debug = require("../../debug");
var helper = require("helper");
var Template = require("template");
var Blog = require("blog");

settings.use(function (req, res, next) {
  res.locals.selected = { settings: "selected" };
  next();
});

settings.use(function (req, res, next) {
  res.locals.setup = !!req.query.setup;
  next();
});

settings
  .route("/settings")
  .post(
    debug("parsing form"),
    save.parse,
    debug("parsed form"),
    save.redirects,
    debug("saved redirects"),
    save.format,
    debug("formated form"),
    save.avatar,
    debug("saved avatar"),
    save.removeTmpFiles,
    debug("removed any tmp files"),
    save.finish
  )
  .get(
    debug("loading folder"),
    require("../folder"),
    load.template,
    debug("template loaded"),
    load.menu,
    debug("menu loaded"),
    load.client,
    debug("client loaded"),
    function (req, res) {
      res.render("settings", { title: req.blog.pretty.label });
    }
  );

settings.get("/settings/links", load.menu);

settings.get(
  "/settings/services",
  load.plugins,
  load.permalinkFormats,
  load.dates
);

settings.get("/settings/services/date", load.timezones, load.dates);

settings.get("/settings/services/permalinks", load.permalinkFormats, function (
  req,
  res,
  next
) {
  res.locals.edit = !!req.query.edit;
  next();
});

settings.use("/settings/services/*", function (req, res, next) {
  res.locals.breadcrumbs.add("Services", "services");
  next();
});

settings
  .route("/settings/services/404s")
  .get(load.fourOhFour, function (req, res) {
    res.locals.breadcrumbs.add("404 log", "404s");
    res.render("settings/404s", { title: "404s" });
  })
  .post(
    require("body-parser").urlencoded({ extended: false }),
    require("./save/404")
  );

settings.get("/settings/services/redirects", load.redirects, function (
  req,
  res
) {
  res.locals.breadcrumbs.add("Redirects", "redirects");
  res.locals.partials.subpage = "settings/redirects";
  res.locals.edit = !!req.query.edit;
  res.render("settings/subpage", { title: "Redirects" });
});

// Load the list of templates for this user

settings.use("/settings/template", load.templates, function (req, res, next) {
  res.locals.breadcrumbs.add("Template", "template");
  next();
});

settings.use("/settings/client", require("./client"));

settings
  .route("/settings/template")
  .get(function (req, res) {
    res.render("template", { title: "Template" });
  })
  .post(require("./save/template"));

settings
  .route("/settings/template/new")
  .get(function (req, res) {
    res.locals.breadcrumbs.add("New", "new");
    res.render("template/new", { title: "New template" });
  })
  .post(require("./save/newTemplate"));

settings
  .route("/settings/template/archive")
  .all(load.pastTemplates)
  .get(function (req, res) {
    res.locals.breadcrumbs.add("Archive", "archive");
    res.render("template/archive", { title: "Archive" });
  });

settings
  .route("/settings/theme/:template/share/:handle")
  .all(function (req, res, next) {
    Blog.get({ handle: req.params.handle }, function (err, blog) {
      if (err || !blog) return next(err || new Error("No blog"));

      if (blog.handle === req.blog.handle)
        return next(new Error("This is your template."));

      // makeSlug is called twice (stupidly, accidentally)
      // in the process to create a template. This double encodes
      // certain characters like ø. It means that we need to run
      // makeSlug twice when looking up a template by its slug.
      // makeID calls makeSlug under the hood so we only need
      // to call it once ourselves.
      var name = helper.makeSlug(req.params.template);
      var templateID = Template.makeID(blog.id, name);

      Template.getMetadata(templateID, function (err, template) {
        if (err || !blog) return next(err || new Error("No template"));

        res.locals.template = template;
        next();
      });
    });
  })

  .get(function (req, res) {
    res.render("template/share");
  })

  .post(function (req, res, next) {
    var template = res.locals.template;

    template.cloneFrom = res.locals.template.id;
    template.owner = req.blog.id;

    Template.create(req.blog.id, template.name, template, function then(err) {
      if (err && err.code === "EEXISTS") {
        template.name = "Copy of " + template.name;
        return Template.create(req.blog.id, template.name, template, then);
      }

      if (err) return next(err);

      res.message("/settings/theme", "Created new template!");
    });
  });

settings.get("/settings/:section/:view", function (req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  res.locals.partials.subpage = "settings/" + req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

settings.get("/settings/:view", function (req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  if (uppercaseName !== "Profile") {
    res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  }

  res.locals.partials.subpage = "settings/" + req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

module.exports = settings;
