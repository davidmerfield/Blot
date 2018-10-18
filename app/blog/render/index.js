var ERROR = require("./error");
var loadView = require("./load");
var getView = require("./getView");
var renderLocals = require("./locals");
var finalRender = require("./main");
var retrieve = require("./retrieve");
var CACHE = require("config").cache;

var debug = require("debug")("blot:blog:render");

// The http headers
var CONTENT_TYPE = "Content-Type";
var CACHE_CONTROL = "Cache-Control";

var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

var cacheDuration = "public, max-age=31536000";
var JS = "application/javascript";
var STYLE = "text/css";

module.exports = function(req, res, next) {
  res.renderView = function renderView(viewID, callback) {
    debug(viewID);

    next = req.next;

    if (!req.template) return next();

    getView(req.blog.id, req.template.id, viewID, function(err, view) {
      if (err) return next(err);

      res.locals = res.locals || {};
      res.locals.partials = res.locals.partials || {};
      req.blog.locals = req.blog.locals || {};

      Object.assign(res.locals, view.locals, req.template.locals, req.blog, req.blog.locals);

      Object.assign(res.locals.partials, view.partials);

      retrieve(req, view.retrieve, function(err, foundLocals) {
        Object.assign(res.locals, foundLocals);

        // LOAD ANY LOCALS OR PARTIALS
        // WHICH ARE REFERENCED IN LOCALS
        loadView(req, res, function(err, req, res) {
          if (err) return next(ERROR.BAD_LOCALS());

          debug("rendering locals");
          renderLocals(res.locals);
          debug("rendered locals");

          var output;
          var locals = res.locals;
          var partials = res.locals.partials;

          if (req.query && req.query.json) {
            res.set("Cache-Control", "no-cache");
            return res.json(res.locals);
          }

          try {
            debug("finally rendering");
            output = finalRender(view.content, locals, partials);
            debug("rendered");
          } catch (e) {
            return next(ERROR.BAD_LOCALS());
          }

          if (callback) {
            return callback(null, output);
          }

          if (CACHE && (view.type === STYLE || view.type === JS)) {
            res.header(CACHE_CONTROL, cacheDuration);
          }

          // I believe this minification
          // bullshit locks up the server while it's
          // doing it's thing. How can we do this in
          // advance? If it throws an error, the user
          // probably forgot an equals sign or some bs...
          try {
            if (view.type === STYLE && !req.preview)
              output = minimize.minify(output || "");

            if (view.type === JS && !req.preview)
              output = UglifyJS.minify(output, { fromString: true }).code;
          } catch (e) {}

          res.header(CONTENT_TYPE, view.type || "text/html");
          res.send(output);
          debug(viewID, "complete");
        });
      });
    });
  };
  next();
};
