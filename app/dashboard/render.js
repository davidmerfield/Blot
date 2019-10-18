module.exports = function(req, res, next) {
  var _render = res.render;
  var wrapper;
  res._render = _render;
  res.render = function(view, locals, callback) {
    if (view === "error") {
      res.locals.partials = res.locals.partials || {};
      res.locals.partials.head = __dirname + "/views/partials/head";
      res.locals.partials.dropdown = __dirname + "/views/partials/dropdown";
      res.locals.partials.footer = __dirname + "/views/partials/footer";

      return _render.call(this, view, locals, callback);
    }

    if (view.indexOf("sign-up") > -1 || view.indexOf("log-in") > -1) {
      console.log("HERE");

      res.locals.partials.yield = view;

      wrapper = __dirname + "/views/partials/wrapper-public.html";

      return _render.call(this, wrapper, locals, callback);
    }

    if (
      view.indexOf("create-blog") > -1 ||
      view.indexOf("wrapper-setup") > -1
    ) {
      res.locals.partials = res.locals.partials || {};
      res.locals.partials.head = __dirname + "/views/partials/head";
      res.locals.partials.dropdown = __dirname + "/views/partials/dropdown";
      res.locals.partials.footer = __dirname + "/views/partials/footer";

      return _render.call(this, view, locals, callback);
    }

    if (req.query.setup)
      wrapper = __dirname + "/views/partials/wrapper-setup.html";
    else {
      wrapper = __dirname + "/views/partials/wrapper.html";
    }

    if (view === "_static_wrapper") {
      console.log("HERE");

      // wrapper = __dirname + "/views/partials/static_wrapper.html";

      if (
        res.locals.partials.yield &&
        (res.locals.partials.yield.indexOf("help") > -1 ||
          res.locals.partials.yield.indexOf("dev") > -1 ||
          res.locals.partials.yield.indexOf("config") > -1 ||
          res.locals.partials.yield.indexOf("account") > -1)
      ) {
        res.locals.partials.sidebar = __dirname + "/views/partials/sidebar";
      }
    } else {
      res.locals.partials = res.locals.partials || {};
      res.locals.partials.head = __dirname + "/views/partials/head";
      res.locals.partials.dropdown = __dirname + "/views/partials/dropdown";
      res.locals.partials.footer = __dirname + "/views/partials/footer";

      res.locals.partials.yield = view;
    }

    _render.call(this, wrapper, locals, callback);
  };

  next();
};
