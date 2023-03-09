var Express = require("express");
var brochure = new Express.Router();
var config = require("config");
var titleFromSlug = require("helper/titleFromSlug");
var trace = require("helper/trace");
var TITLES = {
  "how": "How to use Blot",
  "terms": "Terms of use",
  "privacy": "Privacy policy",
  "sync": "Sync your folder",
  "configure": "Configure your site",
  "google-drive": "Google Drive",
  "markdown": "Text and Markdown",
  "word-documents": "Word Documents",
  "html": "HTML",
  "how-blot-works": "How Blot works",
  "ask": "Ask a question",
  "urls": "URL format",
  "hard-stop-start-ec2-instance": "How to stop and start an EC2 instance",
  "who": "Who uses Blot?",
  "developers": "Developer guide",
  "json-feed": "JSON feed",
  "posts-tagged": "A page with posts with a particular tag",
};

brochure.use(trace("inside routes sub app"));

brochure.get(["/how/format/*"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;
  next();
});

brochure.use(require("./questions/related"));

brochure.get(["/contact"], (req, res, next) => {
  res.locals.fullWidth = true;
  next();
});

brochure.get(
  ["/about", "/how/configure", "/templates", "/questions"],
  (req, res, next) => {
    res.locals["hide-on-this-page"] = true;
    next();
  }
);

// Adds a handy 'edit this page' link
brochure.use(
  ["/how", "/templates", "/about"],
  require("./tools/determine-source")
);

brochure.use(function (req, res, next) {
  res.locals.breadcrumbs = require("url")
    .parse(req.url)
    .pathname.split("/")
    .map(function (slug, i, arr) {
      if (!slug) return { label: "Blot", first: true, url: "/" };
      return {
        label: TITLES[slug] || titleFromSlug(slug),
        url: arr.slice(0, i + 1).join("/"),
        last: i === arr.length - 1,
      };
    });

  if (req.url === "/") {
    res.locals.breadcrumbs = res.locals.breadcrumbs.slice(0, 1);
    res.locals.breadcrumbs[0].last = true;
  }

  if (res.locals.breadcrumbs.length < 3) res.locals.hidebreadcrumbs = true;

  next();
});

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

const VIEWS = require("path").resolve(__dirname + "/../views");

brochure.get("/account/logged-out", function (req, res) {
  res.sendFile(VIEWS + "/logged-out.html");
});

brochure.use("/account", function (req, res, next) {
  // we don't want search engines indexing these pages
  // since they're /logged-out, /disabled and
  res.set("X-Robots-Tag", "noindex");
  next();
});

brochure.get("/", require("./featured"));

brochure.get("/", function (req, res, next) {
  res.locals.layout = "partials/layout-index";
  res.locals.title = "Blot – A blogging platform with no interface.";
  res.locals.description =
    "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";
  // otherwise the <title> of the page is 'Blot - Blot'
  res.locals.hide_title_suffix = true;
  next();
});
brochure.use("/fonts", require("./fonts"));

brochure.get("/sitemap.xml", require("./sitemap"));

brochure.use("/templates/developers", require("./developers"));

brochure.use("/about/notes", require("./notes"));

brochure.use("/templates", require("./templates"));

brochure.use("/about/news", require("./news"));

brochure.use("/sign-up", require("./sign-up"));

brochure.use("/log-in", require("./log-in"));

brochure.use("/questions", require("./questions"));

brochure.use("/how/configure/domain", function (req, res, next) {
  res.locals.ip = config.ip;
  next();
});

brochure.use(trace("calling render"));

brochure.use(function (req, res) {
  res.render();
});

brochure.use(function (err, req, res, next) {
  if (err && err.message && err.message.indexOf("Failed to lookup view") === 0)
    return next();

  next(err);
});

module.exports = brochure;
