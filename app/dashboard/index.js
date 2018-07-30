var express = require("express");
var dashboard = express();
var middleware = require("middleware");
var hogan = require("hogan-express");
var compression = require("compression");
var config = require("config");
var add = middleware.add;
var bodyParser = require("body-parser");
var csurf = require("csurf");
var csrf = csurf();

dashboard
  .use(middleware.forceSSL)
  .use(compression())

  // The disable('x-powered-by')
  // and use(compression()) must
  // be specified for each individual
  // app. Express considers each seperately.
  .disable("x-powered-by")

  .set("trust proxy", "loopback")
  .set("view engine", "html")
  .set("views", __dirname + "/views")
  .engine("html", hogan);

// For when we want to cache templates
if (config.environment !== "development") dashboard.enable("view cache");

// Define these individually don't
// overwrite server.locals
dashboard.locals.protocol = config.protocol;
dashboard.locals.host = config.host;
dashboard.locals.title = "Blot";
dashboard.locals.cacheID = Date.now();

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

    var tab = {};
    var tabname = view;

    if (tabname.indexOf("/") > -1)
      tabname = tabname.slice(0, tabname.indexOf("/"));

    tab[tabname] = "selected";
    if (view !== "index") {
      res.locals.subpage_title = res.locals.title;
      res.locals.subpage_slug = view;
    }
    res.addLocals({ tab: tab });

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

    var tab = {};

    if (view.indexOf("folder") > -1) {
      tab.folder = "selected";
    } else {
      tab.settings = "selected";
    }

    res.addLocals({ tab: tab });
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
