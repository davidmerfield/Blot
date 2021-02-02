var Express = require("express");
var brochure = new Express.Router();
var finder = require("finder");
var tex = require("./tools/tex");
var config = require("config");
var titleFromSlug = require("app/helper/titleFromSlug");

var TITLES = {
  how: "How to use Blot",
  terms: "Terms of use",
  privacy: "Privacy policy",
  domain: "Use your domain",
  "hard-stop-start-ec2-instance": "How to stop and start an EC2 instance",
  "json-feed": "JSON feed",
  "posts-tagged": "A page with posts with a particular tag"
};

// Minifies HTML
brochure.use(require("./tools/minify-html"));

brochure.use(function (req, res, next) {
  if (req.url === '/') return next();

  res.locals.breadcrumbs = req.url.split("/").map(function (slug, i, arr) {
    if (!slug) return { label: "Home", url: "/" };
    return {
      label: TITLES[slug] || titleFromSlug(slug),
      url: arr.slice(0, i + 1).join("/"),
      last: i === (arr.length - 1)
    };
  });

  next();
});

// Inlines all CSS properties
brochure.use(require("./tools/inline-css"));

// Renders the folders and text editors
brochure.use(finder.middleware);

// Renders TeX
brochure.use(tex);

// Fixes basic typographic errors
// See typeset.js for more information
brochure.use(require("./tools/typeset"));

// Generate a table of contents for each page
brochure.use(require("./tools/on-this-page"));

// Retrieves the timestamp of the last commit
brochure.use(require("./tools/last-updated"));

brochure.use(function (req, res, next) {
  res.locals.base = "";
  res.locals.selected = {};
  var url = req.originalUrl;

  // Trim trailing slash from the URL before working out which
  // slugs to set as selected. This ensures that the following url
  // https://blot.im/how/ will set {{publishingIndex}} as selected
  if (url.length > 1 && url.slice(-1) === "/") url = url.slice(0, -1);

  var slugs = url.split("/");

  slugs.forEach(function (slug) {
    res.locals.selected[slug] = "selected";
  });

  res.locals.selected[slugs[slugs.length - 1] + "Index"] = "selected";

  // Handle index page of site.
  if (req.originalUrl === "/") res.locals.selected.index = "selected";

  let slug = slugs.pop() || "Blot";
  let title = TITLES[slug] || titleFromSlug(slug);
  res.locals.title = title;

  next();
});

brochure.use("/account", function (req, res, next) {
  // we don't want search engines indexing these pages
  // since they're /logged-out, /disabled and
  res.set("X-Robots-Tag", "noindex");
  next();
});


brochure.use("/fonts", require("./fonts"));

brochure.use("/examples", require("./featured"));

brochure.get("/sitemap.xml", require("./sitemap"));

brochure.use("/developers", require("./developers"));

brochure.use("/notes", require("./notes"));

brochure.use("/templates", require("./templates"));

brochure.use("/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.use("/how/guides/domain", function (req, res, next) {
  res.locals.ip = config.ip;
  next();
});

brochure.use(function (req, res) {
  res.render(trimLeadingAndTrailingSlash(req.path));
});

brochure.use(function (err, req, res, next) {
  if (err && err.message && err.message.indexOf("Failed to lookup view") === 0)
    return next();

  next(err);
});

function trimLeadingAndTrailingSlash(str) {
  if (!str) return str;
  if (str[0] === "/") str = str.slice(1);
  if (str[str.length - 1] === "/") str = str.slice(0, -1);
  return str;
}

module.exports = brochure;
