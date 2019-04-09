var errorHandler = require("./errorHandler");
var express = require("express");
var settings = express.Router();
var load = require("./load");
var save = require("./save");
var debug = require("../../debug");
var helper = require("helper");
var Template = require("template");
var Blog = require("blog");
var load = require("./load");

settings.use(function(req, res, next) {
  res.locals.selected = { settings: "selected" };
  next();
});

settings.use(function(req, res, next) {
  res.locals.breadcrumbs.add(
    req.blog.title || req.blog.pretty.url,
    "/settings"
  );
  res.locals.setup = !!req.query.setup;

  next();
});

settings
  .route("/settings")
  .post(
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
    load.template,
    debug("template loaded"),
    load.menu,
    debug("menu loaded"),
    load.client,
    debug("client loaded"),
    load.dates,
    debug("dates loaded"),
    load.permalinkFormats,
    debug("permalinks loaded"),
    function(req, res) {
      res.render("settings", { title: "Dashboard" });
    }
  );

settings.get("/settings/urls", function(req, res, next) {
  res.locals.edit = !!req.query.edit;
  next();
});

settings.use(
  "/settings/profile",
  load.menu,
  load.timezones,
  load.dates,
  function(req, res, next) {
    res.locals.breadcrumbs.add("Profile", "profile");
    res.locals.setup_title = true;
    next();
  }
);

settings.get("/settings/profile/menu", load.menu);
settings.get("/settings/date", load.timezones, load.dates);
settings.get("/settings/services", load.plugins);
settings.get("/settings/urls", load.permalinkFormats);

settings.use("/settings/urls/*", function(req, res, next) {
  res.locals.breadcrumbs.add("URLs", "urls");
  next();
});

settings
  .route("/settings/urls/404s")
  .get(load.fourOhFour, function(req, res) {
    res.locals.breadcrumbs.add("404 log", "404s");
    res.render("settings/404s", { title: "404s" });
  })
  .post(
    require("body-parser").urlencoded({ extended: false }),
    require("./save/404")
  );

settings.get("/settings/urls/redirects", load.redirects, function(req, res) {
  res.locals.breadcrumbs.add("Redirects", "redirects");
  res.locals.partials.subpage = "settings/redirects";
  res.render("settings/subpage", { title: "Redirects" });
});

// Load the list of templates for this user

settings.use("/settings/theme", load.theme, function(req, res, next) {
  res.locals.breadcrumbs.add("Template", "theme");
  next();
});

settings.use("/settings/client", require("./client"));

settings
  .route("/settings/theme")
  .get(function(req, res) {
    res.render("theme", { title: "Template" });
  })
  .post(require("./save/theme"));

settings
  .route("/settings/theme/new")
  .get(function(req, res) {
    res.locals.breadcrumbs.add("New", "new");
    res.render("theme/new", { title: "New template" });
  })
  .post(require("./save/newTheme"));

settings
  .route("/settings/theme/past")
  .all(load.pastTemplates)
  .get(function(req, res) {
    res.locals.breadcrumbs.add("Past", "past");
    res.render("theme/past", { title: "Past templates" });
  });

settings
  .route("/settings/theme/:template/share/:handle")
  .all(function(req, res, next) {
    Blog.get({ handle: req.params.handle }, function(err, blog) {
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

      Template.getMetadata(templateID, function(err, template) {
        if (err || !blog) return next(err || new Error("No template"));

        res.locals.template = template;
        next();
      });
    });
  })

  .get(function(req, res) {
    res.render("template/share");
  })

  .post(function(req, res, next) {
    var template = res.locals.template;

    template.cloneFrom = res.locals.template.id;
    template.owner = req.blog.id;

    Template.create(req.blog.id, template.name, template, function(err) {
      if (err) return next(err);

      res.message("/settings/theme", "Created new template!");
    });
  });

settings.get("/settings/:section/:view", function(req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  res.locals.partials.subpage = "settings/" + req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

settings.get("/settings/:view", function(req, res) {
  var uppercaseName = req.params.view;

  uppercaseName = uppercaseName[0].toUpperCase() + uppercaseName.slice(1);

  if (uppercaseName === "Urls") uppercaseName = "URLs";

  if (uppercaseName !== "Profile") {
    res.locals.breadcrumbs.add(uppercaseName, req.params.view);
  }

  res.locals.partials.subpage = "settings/" + req.params.view;
  res.render("settings/subpage", { host: process.env.BLOT_HOST });
});

module.exports = settings;
