var Mustache = require("mustache");
var ERROR = require("./error");
var loadView = require("./load");
var getView = require("./getView");
var CACHE = require("config").cache;

var debug = require("debug")("blot:blog:render");

// The http headers

var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

var cacheDuration = "public, max-age=31536000";
var JS = "application/javascript";
var STYLE = "text/css";
var OVERFLOW = "Maximum call stack size exceeded";

module.exports = function(req, res, next) {
  if (!req.template) return next();

  res.renderView = function renderView(viewID, callback) {
    var output;

    debug(viewID);
    next = req.next;

    debug("loading view");

    getView(req, viewID, function(err, view) {
      if (err) return next(err);

      debug("loaded view");

      try {
        res.locals = res.locals || {};
        res.locals.partials = res.locals.partials || {};
        req.blog.locals = req.blog.locals || {};

        Object.assign(
          res.locals,
          view.locals,
          req.template.locals,
          req.blog,
          req.blog.locals
        );

        Object.assign(res.locals.partials, view.partials);

        debug("augmenting entries");
        loadView(req.blog, res.locals);
        debug("augmented entries");

        debug("finally rendering");
        output = Mustache.render(view.content, res.locals, res.locals.partials);
        debug("rendered");

      } catch (e) {
        if (e.message === OVERFLOW) {
          err = ERROR.INFINITE();
        } else if (e.message.indexOf("Unclosed tag") === 0) {
          err = ERROR.UNCLOSED();
        } else {
          err = e;
        }

        return next(err);
      }

      if (callback) {
        return callback(null, output);
      }

      if (req.query && req.query.json) {
        res.header("Cache-Control", "no-cache");
        return res.json(res.locals);
      }

      res.header("Content-Type", view.type || "text/html");
      res.send(output);
      debug(viewID, "complete");
    });
  };
  next();
};
