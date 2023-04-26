const config = require("config");
const Express = require("express");
const documentation = new Express();
const hogan = require("helper/express-mustache");
const Cache = require("helper/express-disk-cache");
const cache = new Cache(config.cache_directory, { minify: true, gzip: true });
const fs = require("fs-extra");
const redirector = require("./redirector");
const trace = require("helper/trace");

const root = require("helper/rootDir");
const { join } = require("path");
const VIEW_DIRECTORY = join(root, "app/views");

// Register the engine we will use to
// render the views.
documentation.set("view engine", "html");
documentation.set("views", VIEW_DIRECTORY);
documentation.engine("html", hogan);
documentation.disable("x-powered-by");

// .on("add", function (path) {
// })
// .on("ready", function () {
//   walked = true;
// });

documentation.set("transformers", [
  require("./tools/typeset"),
  require("./tools/anchor-links"),
  require("./tools/tex"),
  require("./tools/finder").html_parser,
]);

documentation.set("etag", false); // turn off etags for responses

if (config.cache === false) {
  // During development we want views to reload as we edit
  documentation.disable("view cache");
} else {
  documentation.enable("view cache");
}

// This will store responses to disk for NGINX to serve
documentation.use(cache);

const { plan } = config.stripe;

documentation.locals.layout = "partials/layout";
documentation.locals.ip = config.ip;
documentation.locals.date = require("./dates.js");
documentation.locals.price = "$" + plan.split("_").pop();
documentation.locals.interval = plan.startsWith("monthly") ? "month" : "year";

let cacheID = Date.now();

documentation.locals.cdn = () => (text, render) =>
  `${config.cdn.origin}/documentation/${cacheID}${render(text)}`;

if (config.environment === "development") {
  const chokidar = require("chokidar");
  const watcher = chokidar.watch(VIEW_DIRECTORY, { cwd: VIEW_DIRECTORY });
  const insecureRequest = require("./tools/insecure-request");

  // Flags to prevent locking up the server by doing this too many times
  let flushing = false;
  let again = false;

  watcher.on("change", async function flush(path) {
    if (flushing) {
      again = true;
      return;
    }

    flushing = true;

    cache.flush({ host: config.host }, (err) => console.log(err));
    cacheID = Date.now();

    insecureRequest(
      `https://${config.host}/cdn/documentation/${cacheID}/style.min.css`
    );
    insecureRequest(
      `https://${config.host}/cdn/documentation/${cacheID}/documentation.min.js`
    );

    let urlPath;

    if (path.endsWith(".html")) {
      urlPath = "/" + path.slice(0, -".html".length);
      if (urlPath.endsWith("index"))
        urlPath = urlPath.slice(0, -"index".length);
    }

    if (urlPath) {
      const url = `https://${config.host}${urlPath}`;

      insecureRequest(url);
    }

    flushing = false;

    if (again) {
      again = false;
      flush();
    }
  });
}

documentation.use("/how", (req, res, next) => {
  res.locals.layout = "how/layout";
  next();
});
documentation.get(["/how/format/*"], function (req, res, next) {
  res.locals["show-on-this-page"] = true;
  next();
});

const files = [
  "/favicon-180x180.png",
  "/favicon-32x32.png",
  "/favicon-16x16.png",
  "/favicon.ico",
];

for (const path of files) {
  documentation.get(path, (req, res) =>
    res.sendFile(join(VIEW_DIRECTORY, path), {
      lastModified: false, // do not send Last-Modified header
      maxAge: 86400000, // cache forever
      acceptRanges: false, // do not allow ranged requests
      immutable: true, // the file will not change
    })
  );
}

const directories = ["/fonts", "/css", "/images", "/js", "/videos"];

for (const path of directories) {
  documentation.use(
    path,
    Express.static(VIEW_DIRECTORY + path, {
      index: false, // Without 'index: false' this will server the index.html files inside
      redirect: false, // Without 'redirect: false' this will redirect URLs to existent directories
      maxAge: 86400000,
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

documentation.use("/search", require("./search"));

// Adds a handy 'edit this page' link
documentation.use(
  ["/how", "/templates", "/about"],
  require("./tools/determine-source")
);

documentation.use(require("./selected"));

documentation.use("/examples", require("./featured"));

documentation.get(
  "/",
  require("./tools/git-commits"),
  require("./featured"),
  function (req, res, next) {
    res.locals.layout = "partials/layout-index";
    res.locals.title = "Blot – A blogging platform with no interface.";
    res.locals.description =
      "Turns a folder into a blog automatically. Use your favorite text-editor to write. Text and Markdown files, Word Documents, images, bookmarks and HTML in your folder become blog posts.";
    // otherwise the <title> of the page is 'Blot - Blot'
    res.locals.hide_title_suffix = true;
    next();
  }
);

documentation.use("/fonts", require("./fonts"));

documentation.get("/sitemap.xml", require("./sitemap"));

documentation.use("/templates/developers", require("./developers"));

documentation.use("/about/notes", require("./notes"));

documentation.use("/templates", require("./templates"));

documentation.use("/about/news", require("./news"));

documentation.use("/questions", require("./questions"));

function trimLeadingAndTrailingSlash(str) {
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
