const config = require("config");
const Express = require("express");
const documentation = new Express();
const mustache = require("helper/express-mustache");
const redirector = require("./redirector");
const Email = require("helper/email");
const cdnURLHelper = require('documentation/tools/cdn-url-helper');
const { join } = require("path");
const VIEW_DIRECTORY = __dirname + "/data";

documentation.set("view engine", "html");
documentation.set("views", VIEW_DIRECTORY);
documentation.engine("html", mustache);
documentation.disable("x-powered-by");

documentation.set("etag", false); // turn off etags for responses

// During development we want views to reload as we edit
if (config.environment === "development") {
  documentation.disable("view cache");
} else {
  documentation.enable("view cache");
}

const { plan } = config.stripe;

documentation.locals.layout = "partials/layout";
documentation.locals.ip = config.ip;
documentation.locals.date = require("./dates.js");
documentation.locals.price = "$" + plan.split("_").pop();
documentation.locals.interval = plan.startsWith("monthly") ? "month" : "year";

documentation.locals.cdnURL = config.cdn.origin;
documentation.locals.cdn = cdnURLHelper({cacheID: Date.now(), viewDirectory: VIEW_DIRECTORY});

documentation.get(["/how/format/*"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;
  next();
});

const files = [
  "/favicon-180x180.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/favicon.ico"
];

for (const path of files) {
  documentation.get(path, (req, res) =>
    res.sendFile(join(VIEW_DIRECTORY, path), {
      lastModified: false, // do not send Last-Modified header
      maxAge: 86400000, // cache forever
      acceptRanges: false, // do not allow ranged requests
      immutable: true // the file will not change
    })
  );
}

// serve the VIEW_DIRECTORY as static files
documentation.use(
  Express.static(VIEW_DIRECTORY, {
    index: false, // Without 'index: false' this will server the index.html files inside
    redirect: false, // Without 'redirect: false' this will redirect URLs to existent directories
    maxAge: 86400000 // cache forever
  })
);

const directories = ["/fonts", "/css", "/images", "/js", "/videos"];

for (const path of directories) {
  documentation.use(
    path,
    Express.static(VIEW_DIRECTORY + path, {
      index: false, // Without 'index: false' this will server the index.html files inside
      redirect: false, // Without 'redirect: false' this will redirect URLs to existent directories
      maxAge: 86400000 // cache forever
    })
  );
}

documentation.use(require("./questions/related"));

documentation.get("/contact", (req, res, next) => {
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
  ["/how", "/about"],
  require("./tools/determine-source")
);

documentation.use(require("./selected"));

documentation.get("/", require("./templates.js"), function (req, res, next) {
  res.locals.title = "Blot";
  res.locals.description =
    "A blogging platform with no interface. Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";
  // otherwise the <title> of the page is 'Blot - Blot'
  res.locals.hide_title_suffix = true;
  next();
});

documentation.post(['/support', '/contact', '/feedback'],
  Express.urlencoded({ extended: true }),
 (req, res) => {
  const { email, message } = req.body;
  if (!message) return res.status(400).send('Message is required');
  Email.SUPPORT(null, { email, message });
  res.send('OK');
});

documentation.get("/examples", require("./featured"));

documentation.get("/templates",  require("./templates.js"));
documentation.get("/templates/folders", require("./templates.js"));

documentation.get(
  "/templates/:template",
  require("./templates.js"),
  (req, res, next) => {
    if (!res.locals.template) return next();
    res.render("templates/template");
  }
);

documentation.use(
  "/templates/folders/:folder",
  require("./templates.js"),
  (req, res, next) => {
    if (!res.locals.folder) return next();
    res.render("templates/folders/folder");
  }
);

documentation.use("/templates/fonts", require("./fonts"));

documentation.use("/developers", require("./developers"));

documentation.get("/sitemap.xml", require("./sitemap"));

documentation.use("/about", require("./about.js"));

documentation.use("/news", require("./news"));

documentation.use("/questions", require("./questions"));

function trimLeadingAndTrailingSlash (str) {
  if (!str) return str;
  if (str[0] === "/") str = str.slice(1);
  if (str[str.length - 1] === "/") str = str.slice(0, -1);
  return str;
}

documentation.use(function (req, res, next) {
  const view = trimLeadingAndTrailingSlash(req.path) || "index";

  if (require("path").extname(view)) {
    return next();
  }

  res.render(view);
});

documentation.use((err, req, res, next) => {
  if (err && err.message.startsWith("Failed to lookup view")) return next();
  next(err);
});

// Will redirect old broken links
documentation.use(redirector);

// Missing page
documentation.use(function (req, res, next) {
  const err = new Error("Page not found");
  err.status = 404;
  next(err);
});

// Some kind of other error
// jshint unused:false
documentation.use(function (err, req, res, next) {
  res.locals.code = { error: true };

  if (config.environment === "development") {
    res.locals.error = { stack: err.stack };
  }

  res.locals.layout = "";
  res.status(err.status || 500);
  res.render("error");
});

module.exports = documentation;
