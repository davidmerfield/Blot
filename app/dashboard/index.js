var express = require("express");
var dashboard = express();
var middleware = require("middleware");
var hogan = require("hogan-express");
var compression = require("compression")();
var add = middleware.add;
var bodyParser = require("body-parser");
var csurf = require("csurf");
var csrf = csurf();

// Logs the time spent rendering each page
dashboard.use(middleware.responseTime);

// Enable GZIP
dashboard.use(compression);

// Hide the header which says the app
// is built with Express
dashboard.disable("x-powered-by");

// Without trust proxy is not set, express
//  will incorrectly register the proxy’s IP address
// as the client IP address unless trust proxy is configured.
dashboard.set("trust proxy", "loopback");

// Register the engine we will use to 
// render the views. 
dashboard.set("view engine", "html");
dashboard.set("views", __dirname + "/views");
dashboard.engine("html", hogan);

// For when we want to cache templates
if (process.env.BLOT_ENVIRONMENT !== "development") {
  dashboard.enable("view cache");
} 

dashboard.set("host", process.env.BLOT_HOST);
dashboard.set("title", "Blot");
dashboard.set("cacheID", Date.now());

dashboard.use(function(req, res, next) {

  res.title = function(title) {
    res.locals.title = title;
  };

  res.renderAccount = function(view) {
    delete res.locals.partials;

    res.locals.partials = {};

    res.addPartials({
      head: "partials/head",
      footer: "partials/footer",
      nav: "partials/nav",
      yield: "account/" + view
    });

    res.render("account/wrapper");
  };

  res.renderDashboard = function(view, wrapper) {
    // what are the consequences of not deleting these partials?
    // delete res.locals.partials;

    res.locals.partials = res.locals.partials || {};

    res.addPartials({
      head: "partials/head",
      header: "partials/header",
      footer: "partials/footer",
      nav: "partials/nav",
      yield: view
    });

    res.render(wrapper || "partials/wrapper");
  };

  next();
});

dashboard.use(add());

dashboard.use(middleware.messenger);
dashboard.use(middleware.loadUser);
dashboard.use(middleware.loadBlog);
dashboard.use(middleware.redirector);

dashboard.get("/", require('./routes/folder'));

dashboard.use(['/settings*', '/title', '/domain', '/clients*', '/theme*'
  ],require('./routes/folder'));

dashboard.get("/view", function(req, res){
  req.session.path = decodeURIComponent(req.query.path) || "/";
  return res.redirect(req.query.redirect || "/");
});

dashboard.post(
  ["/theme*", "/folder*", "/clients*", "/flags", "/404s", "/account*"],
  bodyParser.urlencoded({ extended: false })
);

dashboard.use(csrf, function(req, res, next) {
  // Load the CSRF protection since we're
  // inside the app,
  res.addLocals({
    csrftoken: req.csrfToken()
  });

  next();
});

require("./routes/clients")(dashboard);
require("./routes/account")(dashboard);
require("./routes/editor")(dashboard);
require("./routes/theme")(dashboard);
require("./routes/tools")(dashboard);
require("./routes/settings")(dashboard);

dashboard.use(express.static(__dirname + "/views"));

// need to handle dashboard errors better...
dashboard.use(function(err, req, res, next) {
  console.log(err);
  console.log(err.trace);
  console.log(err.stack);
  res.status(500);
  res.send(":( Error");
});

module.exports = dashboard;