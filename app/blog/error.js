module.exports = function(server) {
  var helper = require("helper");
  var type = helper.type;
  var log = require("./log");
  var Redirects = require("../models/redirects");
  var store404 = require("../models/404").set;
  var config = require("config");
  var CONTACT =
    ' Please <a href="https://' +
    config.host +
    "/contact\">contact me</a> if you cannot fix this. I'll be able to help you.";

  // Redirects
  server.use(function(req, res, next) {
    Redirects.check(req.blog.id, req.url, function(err, redirect) {
      if (err) return next(err);

      // Nothing in the user's setup matches this
      // URL so continue to the next middleware
      if (!redirect) return next();

      // It matched a redirect but since we don't
      // want an infinite redirect loop we continue
      if (redirect === req.url) return next();

      res.redirect(redirect);
    });
  });

  // 404s
  server.use(log.four04);
  server.use(function(req, res, next) {
    res.addLocals({
      error: {
        title: "Page not found",
        message: "There is no page on this blog with this URL.",
        status: 404
      }
    });

    res.status(404);
    res.renderView("error.html", next);

    // We expose these to the user
    store404(req.blog.id, req.url);
  });

  // Errors
  server.use(log.error);
  server.use(function(err, req, res, next) {
    // This reponse was partially finished
    // end it now and get over it...
    if (res.headersSent) return res.end();

    // Monit requests localhost/health to determine whether
    // to attempt to restart Blot's node Blot. If you remove
    // this, change monit.rc too. This middleware must come
    // before the blog middleware, since there is no blog with
    // the host 'localhost' and hence returns a 404, bad!    
    if (err.code === "ENOENT" && req.hostname === "localhost") {
      return next();
    } 

    // Blog does not exist...
    if (err.code === "ENOENT") {
      res.status(404);
      res.send("There is no blog at this address." + CONTACT);
      return;
    }

    var status = 500;

    if (err.status && type(err.status, "number")) status = err.status;

    res.addLocals({
      error: {
        title: "Error",
        message: "",
        status: err.status
      }
    });

    res.renderView("error.html", next, function(err, output) {
      if (err) return next(err);

      res.status(status || 500);
      res.send(output);
    });
  });

  // There was an issue with renderView
  server.use(function(err, req, res, next) {
    if (res.headersSent) return res.end();

    res.status(500);
    res.send("Your blog's template failed to render properly." + CONTACT);
  });
};
