const config = require("config");
const Express = require("express");
const documentation = new Express();
const hogan = require("hogan-express");
const Cache = require("express-disk-cache");
const cache = new Cache(config.cache_directory);
const moment = require("moment");
const fs = require("fs-extra");
const redirector = require("./redirector");
const trace = require("helper/trace");
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

documentation.use(function (req, res, next) {
  const _render = res.render;
  res.render = function (body_template) {
    const body =
      body_template || trimLeadingAndTrailingSlash(req.path) || "index.html";
    const layout = res.locals.layout || PARTIAL_DIRECTORY + "/layout.html";

    res.locals.partials = { body };

    const partials = require("fs-extra")
      .readdirSync(PARTIAL_DIRECTORY)
      .filter((i) => i.endsWith(".html"))
      .map((i) => i.slice(0, i.lastIndexOf(".")));

    partials.forEach(
      (partial) => (res.locals.partials[partial] = `partials/${partial}.html`)
    );

    _render.call(this, layout, function (err, html) {
      if (err) {
        console.log("Render error:", err);
        return res.req.next();
      }
      res.send(html);
    });
  };
  next();
});

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

documentation.use(
  Express.static(VIEW_DIRECTORY, { index: false, redirect: false })
);

documentation.use(trace("before routes"));

// Now we actually load the routes for the documentation website.
documentation.use(require("./routes"));

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
