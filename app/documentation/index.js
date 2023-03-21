const config = require("config");
const Express = require("express");
const documentation = new Express();
const hogan = require("helper/express-mustache");
const Cache = require("express-disk-cache");
const cache = new Cache(config.cache_directory);
const moment = require("moment");
const fs = require("fs-extra");
const redirector = require("./redirector");
const trace = require("helper/trace");

var titleFromSlug = require("helper/titleFromSlug");

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

const VIEW_DIRECTORY =
  process.env.FAST === "true"
    ? __dirname + "/../views"
    : __dirname + "/../views"; // data/views

const PARTIAL_DIRECTORY = VIEW_DIRECTORY + "/partials";

fs.ensureDirSync(VIEW_DIRECTORY);
fs.ensureDirSync(PARTIAL_DIRECTORY);

const chokidar = require("chokidar");

// Neccessary to repeat to set the correct IP for the
// rate-limiter, because this app sits behind nginx
documentation.set("trust proxy", "loopback");

// Register the engine we will use to
// render the views.
documentation.set("view engine", "html");
documentation.set("views", VIEW_DIRECTORY);
documentation.engine("html", hogan);

if (config.cache === false) {
  // During development we want views to reload as we edit
  documentation.disable("view cache");
} else {
  // This will store responses to disk for NGINX to serve
  documentation.enable("view cache");
  documentation.use(cache);
}

// This is the layout that HBS uses by default to render a
// page. Look into the source, but basically {{{body}}} in
// partials/layout is replaced with the view passed to
// res.render(). You can modify this in the route if needed.
documentation.locals.layout = "/partials/layout";
documentation.locals.cacheID = Date.now();

// Default page title and <meta> description

documentation.locals.price = "$" + config.stripe.plan.split("_").pop();
documentation.locals.interval =
  config.stripe.plan.indexOf("monthly") === 0 ? "month" : "year";

function trimLeadingAndTrailingSlash(str) {
  if (!str) return str;
  if (str[0] === "/") str = str.slice(1);
  if (str[str.length - 1] === "/") str = str.slice(0, -1);
  return str;
}

// Renders dates dynamically in the documentation.
// Can be used like so: {{#date}}MM/YYYY{{/date}}
documentation.use(function (req, res, next) {
  res.locals.date = function () {
    return function (text, render) {
      try {
        text = text.trim();
        text = moment.utc(Date.now()).format(text);
      } catch (e) {
        text = "";
      }
      return text;
    };
  };
  next();
});

documentation.use(function (req, res, next) {
  if (
    req.user &&
    req.user.subscription &&
    req.user.subscription.plan &&
    req.user.subscription.plan.amount
  ) {
    res.locals.price = "$" + req.user.subscription.plan.amount / 100;
  }

  next();
});

// Without 'index: false' this will server the index.html files inside the
// views folder in lieu of using the render definied in ./routes below.
// Without 'redirect: false' this will redirect URLs to existent directories
// adding an undesirable trailing slash.
documentation.use(
  "/fonts",
  Express.static(VIEW_DIRECTORY + "/fonts", {
    index: false,
    redirect: false,
    maxAge: 86400000,
  })
);

documentation.get("/css/complete.css", async (req, res) => {
  const CleanCSS = require("clean-css");
  const { join } = require("path");

  // merge all css files together into one file
  const cssDir = join(VIEW_DIRECTORY, "css");

  const cssFiles = fs.readdirSync(cssDir).filter((i) => i.endsWith(".css"));

  const mergedCSS = cssFiles
    .map((i) => fs.readFileSync(join(cssDir, i), "utf-8"))
    .map((input) => new CleanCSS().minify(input).styles)
    .join("\n\n");

  res.header("Content-Type", "text/css");
  res.send(mergedCSS);
});

documentation.use(
  "/css",
  Express.static(VIEW_DIRECTORY + "/css", { index: false, redirect: false })
);

documentation.use(
  "/images",
  Express.static(VIEW_DIRECTORY + "/images", { index: false, redirect: false })
);

documentation.use(
  "/js",
  Express.static(VIEW_DIRECTORY + "/js", { index: false, redirect: false })
);

documentation.use(
  "/videos",
  Express.static(VIEW_DIRECTORY + "/videos", { index: false, redirect: false })
);

documentation.use(trace("before routes"));

// Now we actually load the routes for the documentation website.

documentation.use(trace("inside routes sub app"));

documentation.get(["/how/format/*"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;
  next();
});

documentation.use(require("./questions/related"));

documentation.get(["/contact"], (req, res, next) => {
  res.locals.fullWidth = true;
  next();
});

documentation.get(
  ["/about", "/how/configure", "/templates", "/questions"],
  (req, res, next) => {
    res.locals["hide-on-this-page"] = true;
    next();
  }
);

// Adds a handy 'edit this page' link
documentation.use(
  ["/how", "/templates", "/about"],
  require("./tools/determine-source")
);

documentation.use(function (req, res, next) {
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

documentation.use(function (req, res, next) {
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

documentation.get("/", require("./featured"));

documentation.get("/", function (req, res, next) {
  res.locals.layout = "partials/layout-index";
  res.locals.title = "Blot – A blogging platform with no interface.";
  res.locals.description =
    "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";
  // otherwise the <title> of the page is 'Blot - Blot'
  res.locals.hide_title_suffix = true;
  next();
});
documentation.use("/fonts", require("./fonts"));

documentation.get("/sitemap.xml", require("./sitemap"));

documentation.use("/templates/developers", require("./developers"));

documentation.use("/about/notes", require("./notes"));

documentation.use("/templates", require("./templates"));

documentation.use("/about/news", require("./news"));

documentation.use("/questions", require("./questions"));

documentation.use("/how/configure/domain", function (req, res, next) {
  res.locals.ip = config.ip;
  next();
});

documentation.use(function (req, res) {
  if (!res.locals.layout) res.locals.layout = "partials/layout";
  res.render(trimLeadingAndTrailingSlash(req.path) || "index.html");
});

documentation.use(function (err, req, res, next) {
  if (err && err.message && err.message.indexOf("Failed to lookup view") === 0)
    return next();

  next(err);
});

// Will redirect old broken links
documentation.use(redirector);

// Missing page
documentation.use(function (req, res, next) {
  // Pass on requests to static files down to app/blog
  // Express application.
  if (req.path.indexOf("/static") === 0) return next();

  res.status(404);
  res.sendFile(VIEW_DIRECTORY + "/error-404.html");
});

// Some kind of other error
// Prevent a linter warning for 'next' below
// jshint unused:false
documentation.use(function (err, req, res, next) {
  res.locals.code = { error: true };

  if (config.environment === "development") {
    console.error(err);
    res.locals.err = err;
  }

  res.status(err.status || 500);
  res.sendFile(VIEW_DIRECTORY + "/error.html");
});

module.exports = documentation;
