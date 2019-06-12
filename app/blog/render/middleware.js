var Template = require("template");

var ERROR = require("./error");
var loadView = require("./load");
var renderLocals = require("./locals");
var finalRender = require("./main");
var retrieve = require("./retrieve");

var helper = require("helper");
var ensure = helper.ensure;
var extend = helper.extend;
var callOnce = helper.callOnce;
var config = require("config");
var CACHE = config.cache;

// The http headers
var CONTENT_TYPE = "Content-Type";
var CACHE_CONTROL = "Cache-Control";

var UglifyJS = require("uglify-js");
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

var cacheDuration = "public, max-age=31536000";
var JS = "application/javascript";
var STYLE = "text/css";

module.exports = function(req, res, _next) {
  res.renderView = render;

  return _next();

  function render(name, next, callback) {
    // console.log(req.url, 'rendering', viewName);

    ensure(name, "string").and(next, "function");

    if (!req.template) return next();

    var blog = req.blog;
    var blogID = blog.id;
    var templateID = req.template.id;

    if (callback) callback = callOnce(callback);

    Template.getFullView(blogID, templateID, name, function(err, response) {
      if (err || !response) return next(ERROR.NO_VIEW());

      var viewLocals = response[0];
      var viewPartials = response[1];
      var missingLocals = response[2];
      var viewType = response[3];
      var view = response[4];

      extend(res.locals)
        .and(viewLocals)
        .and(req.template.locals)
        .and(blog.locals);

      extend(res.locals.partials).and(viewPartials);

      retrieve(req, missingLocals, function(err, foundLocals) {
        extend(res.locals).and(foundLocals);

        // LOAD ANY LOCALS OR PARTIALS
        // WHICH ARE REFERENCED IN LOCALS
        loadView(req, res, function(err, req, res) {
          if (err) return next(ERROR.BAD_LOCALS());

          // VIEW IS ALMOST FINISHED
          // ALL PARTRIAL
          renderLocals(req, res, function(err, req, res) {
            if (err) return next(ERROR.BAD_LOCALS());

            var output;

            var locals = res.locals;
            var partials = res.locals.partials;

            // ?debug=true _AND_ ?json=true to get template locals as JSON
            if (req.query && (req.query.debug || req.query.json)) {
              if (callback) return callback(null, res.locals);

              res.set("Cache-Control", "no-cache");
              return res.json(res.locals);
            }

            try {
              output = finalRender(view, locals, partials);
            } catch (e) {
              return next(ERROR.BAD_LOCALS());
            }

            if (callback) {
              return callback(null, output);
            }

            // Only cache JavaScript and CSS if the request is not to a preview
            // subdomain and Blot's caching is turned on.
            if (CACHE && !req.preview && (viewType === STYLE || viewType === JS)) {
              res.header(CACHE_CONTROL, cacheDuration);
            }

            // Replace protocol of CDN links for requests served over HTTP
            if (
              viewType.indexOf("text/") > -1 &&
              req.protocol === "http" &&
              output.indexOf(config.cdn.origin) > -1
            )
              output = output
                .split(config.cdn.origin)
                .join(config.cdn.origin.split("https://").join("http://"));

            // I believe this minification
            // bullshit locks up the server while it's
            // doing it's thing. How can we do this in
            // advance? If it throws an error, the user
            // probably forgot an equals sign or some bs...
            try {
              if (viewType === STYLE && !req.preview)
                output = minimize.minify(output || "").styles;

              if (viewType === JS && !req.preview)
                output = UglifyJS.minify(output, { fromString: true }).code;
            } catch (e) {}

            res.header(CONTENT_TYPE, viewType);
            res.send(output);
          });
        });
      });
    });
  }
};
