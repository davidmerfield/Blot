var fs = require("fs-extra");
var Express = require("express");
var brochure = new Express.Router();
var finder = require("finder");
var tex = require("./tools/tex");
var config = require("config");
var Breadcrumbs = require("./tools/breadcrumbs");

var TITLES = {
  publishing: "How to use Blot",
  "public-files": "Public files"
};

var REDIRECTS = {
  "/help/tags": "/publishing/metadata"
};

brochure.use(function(req, res, next) {
  res.locals.breadcrumbs = new Breadcrumbs();
  next();
});

// Minifies HTML
brochure.use(require("./tools/minify-html"));

// Inlines all CSS properties
brochure.use(require("./tools/inline-css"));

// Renders the folders and text editors
brochure.use(finder.middleware);

// Renders TeX
brochure.use(tex);

// Renders dates dynamically
brochure.use(require("./tools/dates"));

// Fixes basic typographic errors
// See typeset.js for more information
brochure.use(require("./tools/typeset"));

brochure.use(function(req, res, next) {
  res.locals.base = "";
  res.locals.selected = {};

  var url = req.originalUrl;

  // Trim trailing slash from the URL before working out which
  // slugs to set as selected. This ensures that the following url
  // https://blot.im/publishing/ will set {{publishingIndex}} as selected
  if (url.length > 1 && url.slice(-1) === "/") url = url.slice(0, -1);

  var slugs = url.split("/");

  slugs.forEach(function(slug, i) {
    res.locals.selected[slug] = "selected";
  });

  res.locals.selected[slugs[slugs.length - 1] + "Index"] = "selected";

  // Handle index page of site.
  if (req.originalUrl === "/") res.locals.selected.index = "selected";

  next();
});

var matter = require("gray-matter");

function loadContributors(req, res, next) {
  fs.readFile(__dirname + "/../views/acknowledgements.yaml", "utf-8", function(
    err,
    contents
  ) {
    if (err) return next(err);

    var dependencies = matter("---\n" + contents + "\n---").data;
    var contributors = [];

    dependencies.forEach(function(dependency) {
      contributors = contributors.concat(dependency.contributors);
    });

    dependencies[dependencies.length - 1].last = true;
    contributors[contributors.length - 1].last = true;

    res.locals.dependencies = dependencies;
    res.locals.contributors = uniqueBy("name", contributors);

    next();
  });
}

function uniqueBy(property, list) {
  var seen = {};

  list = list.filter(function(item) {
    if (seen[item[property]]) return false;
    seen[item[property]] = true;
    return true;
  });

  return list;
}

brochure.get("/about", loadContributors, function(req, res) {
  res.locals.title = "About";
  res.render("about");
});

brochure.get("/support", function(req, res) {
  res.locals.title = "Support";
  res.render("support");
});

brochure.get("/contact", function(req, res) {
  res.locals.title = "Contact";
  res.render("contact");
});

brochure.use("/account", function(req, res, next) {
  res.locals.layout = "/partials/layout-focussed.html";
  // we don't want search engines indexing these pages
  // since they're /logged-out, /disabled and
  res.set("X-Robots-Tag", "noindex");
  next();
});

brochure.get("/terms", function(req, res) {
  res.locals.title = "Terms of use";
  res.locals.layout = "/partials/layout-focussed.html";
  res.render("terms");
});

brochure.get("/privacy", function(req, res) {
  res.locals.title = "Privacy policy";
  res.locals.layout = "/partials/layout-focussed.html";
  res.render("privacy");
});

brochure.get("/sitemap.xml", require("./sitemap"));

brochure.use("/developers", require("./developers"));

brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.param("section", function(req, res, next, section) {
  var title = TITLES[section] || capitalize(section);
  res.locals.sectionTitle = title;
  res.locals.breadcrumbs.add(title, section);
  next();
});

brochure.param("subsection", function(req, res, next, subsection) {
  var title = TITLES[subsection] || capitalize(subsection);
  res.locals.sectionTitle = title;
  res.locals.breadcrumbs.add(title, subsection);
  next();
});

brochure.param("subsubsection", function(req, res, next, subsubsection) {
  var title = TITLES[subsubsection] || capitalize(subsubsection);
  res.locals.sectionTitle = title;
  res.locals.breadcrumbs.add(title, subsubsection);
  next();
});

brochure.get("/", require("./featured"), function(req, res) {
  res.locals.title = "Blot – A blogging platform with no interface";
  res.render("index");
});

brochure.use("/publishing/guides/domain", function(req, res, next) {
  res.locals.ip = config.ip;
  return next();
});

brochure.get("/:section", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (req.params.section.indexOf(".") > -1) {
    return next();
  }

  res.locals.title = res.locals.sectionTitle + " - Blot";

  res.render(req.params.section);
});

brochure.get("/:section/:subsection", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (
    req.params.section.indexOf(".") > -1 ||
    req.params.subsection.indexOf(".") > -1
  ) {
    return next();
  }

  res.locals.title = res.locals.sectionTitle + " - Blot";
  res.render(req.params.section + "/" + req.params.subsection);
});

brochure.get("/:section/:subsection/:subsubsection", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (
    req.params.section.indexOf(".") > -1 ||
    req.params.subsection.indexOf(".") > -1
  ) {
    return next();
  }

  res.locals.title = res.locals.sectionTitle + " - Blot";
  res.render(
    req.params.section +
      "/" +
      req.params.subsection +
      "/" +
      req.params.subsubsection
  );
});

brochure.use(function(err, req, res, next) {
  if (err.code === "MODULE_NOT_FOUND") return next();
  next(err);
});

brochure.use(function(err, req, res, next) {
  if (REDIRECTS[req.url]) return res.redirect(REDIRECTS[req.url]);

  if (err && err.message && err.message.indexOf("Failed to lookup view") === 0)
    return next();

  if (config.environment === "development") {
    console.log(err);
  }

  next();
});

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

module.exports = brochure;
