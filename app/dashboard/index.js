var bodyParser = require("body-parser");
var hogan = require("hogan-express");
var express = require("express");
var debug = require("./debug");
var Blog = require("blog");
var User = require("user");
var async = require("async");
var VIEW_DIRECTORY = __dirname + "/views";
var config = require("config");
var helper = require("helper");
var clfdate = require("helper").clfdate;

// This is the express application used by a
// customer to control the settings and view
// the state of the blog's folder
var dashboard = express();

// Send static files
dashboard.use(
  "/css",
  express.static(VIEW_DIRECTORY + "/css", { maxAge: 86400000 })
);
dashboard.use(
  "/images",
  express.static(VIEW_DIRECTORY + "/images", { maxAge: 86400000 })
);
dashboard.use(
  "/scripts",
  express.static(VIEW_DIRECTORY + "/scripts", { maxAge: 86400000 })
);

// Log response time in development mode
dashboard.use(debug.init);

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
dashboard.set("views", VIEW_DIRECTORY);
dashboard.engine("html", hogan);

// For when we want to cache templates
if (config.environment !== "development") {
  dashboard.enable("view cache");
}

// Cache ID is used for the static assets
// eventually remove this when you merge
// the assets into a single file
dashboard.locals.cacheID = Date.now();

// Special function which wraps redirect
// so I can pass messages between views cleanly
dashboard.use("/clients", require("./routes/clients"));

dashboard.use("/stripe-webhook", require("./routes/stripe_webhook"));

/// EVERYTHING AFTER THIS NEEDS TO BE AUTHENTICATED
dashboard.use(debug("loading session information"));
dashboard.use(require("./session"));
dashboard.use(function(req, res, next) {
  if (req.session && req.session.uid) {
    return next();
  }

  return next(new Error("NOUSER"));
});
dashboard.use(debug("loaded session information"));

dashboard.use(require("./message"));


// Appends a one-time CSRF-checking token
// for each GET request, and validates this token
// for each POST request, using csurf.
dashboard.use(require("./csrf"));

dashboard.use(debug("loading user"));

// Load properties as needed
// these should not be invoked for requests to static files
dashboard.use(function(req, res, next) {
  if (!req.session || !req.session.uid) return next();

  var uid = req.session.uid;

  User.getById(uid, function(err, user) {
    if (err) return next(err);

    if (!user) {
      req.user = null;
      req.session.uid = null;
      return next();
    }

    // Lets append the user and
    // set the partials to 'logged in mode'
    req.user = User.extend(user);
    res.locals.user = user;

    if (user.subscription && user.subscription.plan) {
      res.locals.price = helper.prettyPrice(user.subscription.plan.amount);
      res.locals.interval = user.subscription.plan.interval;
    }

    next();
  });
});

dashboard.use(debug("loaded user"));
dashboard.use(debug("loading blogs"));

dashboard.use(function(req, res, next) {
  if (!req.session || !req.user || !req.user.blogs.length) return next();

  var blogs = [];
  var activeBlog = null;

  async.each(
    req.user.blogs,
    function(blogID, nextBlog) {
      Blog.get({ id: blogID }, function(err, blog) {
        if (!blog) return nextBlog();

        try {
          blog = Blog.extend(blog);
        } catch (e) {
          return next(e);
        }

        if (req.session.blogID === blog.id) {
          blog.isCurrent = true;
          blog.updated = require('moment')(blog.cacheID).fromNow();
          activeBlog = blog;
        }

        blogs.push(blog);
        nextBlog();
      });
    },
    function() {
      if (!activeBlog && !req.session.blogID) {
        activeBlog = blogs.slice().pop();
      }

      // The blog active in the users session
      // no longer exists, redirect them to one
      if (!activeBlog && req.session.blogID) {
        var candidates = blogs.slice();

        candidates = candidates.filter(function(id) {
          return id !== req.session.blogID;
        });

        if (candidates.length > 0) {
          activeBlog = candidates.pop();
          req.session.blogID = activeBlog.id;
          User.set(req.user.uid, { lastSession: activeBlog.id }, function() {});
        } else {
          req.session.blogID = null;
          User.set(req.user.uid, { lastSession: "" }, function() {});
          console.log("THERES NOTHING HERE");
        }
      }

      if (!activeBlog) return next(new Error("No blog"));

      req.blog = activeBlog;
      req.blogs = blogs;

      res.locals.blog = activeBlog;
      res.locals.blogs = blogs;

      return next();
    }
  );
});

dashboard.use(debug("loaded blogs"));

dashboard.use(debug("checking redirects"));

// Performs some basic checks about the
// state of the user's blog, user's subscription
// and shuttles the user around as needed
dashboard.use(require("./redirector"));

dashboard.use(debug("checked redirects"));

// Send user's avatar
dashboard.use("/_avatars/:avatar", function(req, res, next) {
  var blogID;

  if (req.query.handle) {
    blogID = req.blogs
      .filter(function(blog) {
        return blog.handle === req.query.handle;
      })
      .map(function(blog) {
        return blog.id;
      });
  } else {
    blogID = req.blog.id;
  }

  res.sendFile(
    config.blog_static_files_dir +
      "/" +
      blogID +
      "/_avatars/" +
      req.params.avatar,
    function(err) {
      if (err) return next();
      // sent successfully
    }
  );
});

dashboard.post(
  [
    "/settings/template*",
    "/path",
    "/folder*",
    "/settings/client*",
    "/flags",
    "/404s",
    "/account*",
  ],
  bodyParser.urlencoded({ extended: false })
);

// Account page does not need to know about the state of the folder
// for a particular blog

dashboard.use(function(req, res, next) {
  res.locals.partials = res.locals.partials || {};
  // res.locals.partials.head = __dirname + "/views/partials/head";
  // res.locals.partials.dropdown = __dirname + "/views/partials/dropdown";
  // res.locals.partials.footer = __dirname + "/views/partials/footer";
  next();
});

dashboard.use(function(req, res, next) {
  res.locals.links_for_footer = [];

  res.locals.footer = function() {
    return function(text, render) {
      res.locals.links_for_footer.push({ html: text });
      return "";
    };
  };

  next();
});

// dashboard.use('/documentation', require("../site/documentation"));

// Use this before modifying the render function
// since it doesn't use the layout for the rest of the dashboard
dashboard.use("/template-editor", require("./routes/template-editor"));

// Will deliver the sync status of the blog as SSEs
dashboard.use('/status', require("./routes/status"));

// Special function which wraps render
// so there is a default layout and a partial
// inserted into it
dashboard.use(require("./render"));

dashboard.use(function(req, res, next) {
  res.locals.breadcrumbs = new Breadcrumbs();
  next();
});

dashboard.use("/account", require("./routes/account"));

dashboard.use(function(req, res, next) {
  res.locals.breadcrumbs.add("Your account", "/");
  next();
});

dashboard.get("/", function(req, res, next) {
  res.locals.title = "Your account";
  res.render("index");
});

dashboard.use(function(req, res, next) {
  // we use pretty.label instead of title for title-less blogs
  // this falls back to the domain of the blog if no title exists
  res.locals.breadcrumbs.add(req.blog.pretty.label, "/settings");
  res.locals.title = req.blog.pretty.label;
  next();
});

// Load the files and folders inside a blog's folder
dashboard.use("/settings/folder", require("./routes/folder"));

dashboard.use("/settings/folder", function(req, res, next) {
  res.render("folder", { selected: { folder: "selected" } });
});

function Breadcrumbs() {
  var list = [];

  list.add = function(label, slug) {
    var base = "/";

    if (list.length) base = list[list.length - 1].url;

    list.push({ label: label, url: require("path").join(base, slug) });

    for (var i = 0; i < list.length; i++) {
      list[i].first = i === 0;
      list[i].last = i === list.length - 1;
      list[i].only = i === 0 && list.length === 1;
    }
  };

  return list;
}

require("./routes/tools")(dashboard);

dashboard.use(require("./routes/settings"));

dashboard.use(require("./routes/settings/errorHandler"));

// need to handle dashboard errors better...
dashboard.use(require("./routes/error"));

// Restore render function, remove this dumb bullshit eventually
dashboard.use(function(req, res, next) {
  if (res._render) res.render = res._render;
  next();
});

module.exports = dashboard;
