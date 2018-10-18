var Mustache = require("mustache");
var ERROR = require("./error");
var augment = require("./augment");
var retrieve = require("./retrieve");
var debug = require("debug")("blot:blog:render");

module.exports = function(req, res, next) {
  if (!req.template) return next();

  res.renderView = function renderView(viewID, callback) {
    var output;

    debug(viewID);
    next = req.next;

    debug("loading view");

    retrieve(req, viewID, function(err, view) {
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
        augment(req.blog, res.locals);
        debug("augmented entries");

        debug("finally rendering");
        output = Mustache.render(view.content, res.locals, res.locals.partials);
        debug("rendered");
      } catch (e) {
        if (e.message === "Maximum call stack size exceeded") {
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
