var Express = require("express");
var brochure = new Express.Router();
var finder = require("finder");
var tex = require("./tools/tex");
var config = require("config");
var Breadcrumbs = require("./tools/breadcrumbs");

var TITLES = {
  publishing: "How to use Blot"
};

var REDIRECTS = {
  "/help/tags": "/publishing/metadata"
};

// Renders the folders and text editors
brochure.use(finder.middleware);

// Renders TeX
brochure.use(tex);

brochure.use(function(req, res, next) {
  res.locals.breadcrumbs = new Breadcrumbs();
  next();
});

// Renders dates dynamically
brochure.use(require("./tools/dates"));

// Fixes basic typographic errors
// See typeset.js for more information
brochure.use(require("./tools/typeset"));

// CSS required to render the windows
brochure.get("/css/finder.css", function(req, res) {
  res.setHeader("Content-Type", "text/css");
  res.send(finder.css());
});

brochure.get("/about", function(req, res) {
  res.locals.title = "Blot – About";
  res.render("about");
});

brochure.get("/support", function(req, res) {
  res.locals.title = "Blot – Support";
  res.render("support");
});

brochure.get("/contact", function(req, res) {
  res.locals.title = "Contact";
  res.render("contact");
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

// brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.use(function(req, res, next) {
  res.locals.base = "";
  res.locals.selected = {};
  next();
});

brochure.param("section", function(req, res, next, section) {
  var title = TITLES[section] || capitalize(section);
  res.locals.sectionTitle = title;
  res.locals.selected[section] = "selected";
  res.locals.breadcrumbs.add(title, section);
  next();
});

brochure.param("subsection", function(req, res, next, subsection) {
  var title = TITLES[subsection] || capitalize(subsection);
  res.locals.sectionTitle = title;
  res.locals.selected[subsection] = "selected";
  res.locals.breadcrumbs.add(title, subsection);
  next();
});

brochure.param("subsubsection", function(req, res, next, subsubsection) {
  var title = TITLES[subsubsection] || capitalize(subsubsection);
  res.locals.sectionTitle = title;
  res.locals.selected[subsubsection] = "selected";
  res.locals.breadcrumbs.add(title, subsubsection);
  next();
});

brochure.get("/", function(req, res) {
  res.locals.title = "Blot – A blogging platform with no interface";
  res.locals.selected.index = "selected";
  res.locals.featured = require("./featured-sites/result.json");
  res.locals.featured = res.locals.featured.map(function(site) {
    if (site.template) site.templateLower = site.template.toLowerCase();
    return site;
  });

  res.render("index");
});

var tex = require("./tools/tex");

brochure.use("/publishing/formatting", tex);

brochure.get("/:section", function(req, res, next) {
  // This check is designed to prevent an error polluting
  // the logs which happens for requests like /images/foo.png
  // Express doesn't have a renderer for '.png' so there is an error
  if (req.params.section.indexOf(".") > -1) {
    return next();
  }

  res.locals.title = "Blot – " + res.locals.sectionTitle;
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

  res.locals.title = "Blot – " + res.locals.sectionTitle;
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

  res.locals.title = "Blot – " + res.locals.sectionTitle;
  res.render(
    req.params.section +
      "/" +
      req.params.subsection +
      "/" +
      req.params.subsubsection
  );
});

brochure.use(function(err, req, res, next) {
  if (REDIRECTS[req.url]) return res.redirect(REDIRECTS[req.url]);

  next();
});

brochure.use(function(err, req, res, next) {
  if (config.environment === "development") console.log(err);
  next();
});

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}
module.exports = brochure;
