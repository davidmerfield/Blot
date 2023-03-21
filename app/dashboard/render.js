const VIEWS = __dirname + '/../views/dashboard';

module.exports = function (req, res, next) {
  res.locals.partials = res.locals.partials || {};

  var _render = res.render;
  var wrapper;
  res._render = _render;
  res.render = function (view, locals, callback) {
    if (view === "error") {
      res.locals.partials = res.locals.partials || {};
      res.locals.partials.head = VIEWS + "/partials/head";
      res.locals.partials.dropdown = VIEWS + "/partials/dropdown";
      res.locals.partials.footer = VIEWS + "/partials/footer";

      return _render.call(this, view, locals, callback);
    }

    if (view.indexOf("sign-up") > -1 || view.indexOf("log-in") > -1) {
      console.log("HERE");

      res.locals.partials.yield = view;

      wrapper = VIEWS + "/partials/wrapper-public.html";

      return _render.call(this, wrapper, locals, callback);
    }

    if (req.query.setup)
      wrapper = VIEWS + "/partials/wrapper-setup.html";
    else {
      wrapper = VIEWS + "/partials/wrapper.html";
    }

    if (view === "_static_wrapper") {
      console.log("HERE");

      // wrapper = VIEWS + "/partials/static_wrapper.html";

      if (
        res.locals.partials.yield &&
        (res.locals.partials.yield.indexOf("help") > -1 ||
          res.locals.partials.yield.indexOf("dev") > -1 ||
          res.locals.partials.yield.indexOf("config") > -1 ||
          res.locals.partials.yield.indexOf("account") > -1)
      ) {
        res.locals.partials.sidebar = VIEWS + "/partials/sidebar";
      }
    } else {
      res.locals.partials = res.locals.partials || {};
      res.locals.partials.head = VIEWS + "/partials/head";
      res.locals.partials.dropdown = VIEWS + "/partials/dropdown";
      res.locals.partials.footer = VIEWS + "/partials/footer";

      res.locals.partials.yield = view;
    }

    _render.call(this, wrapper, locals, callback);
  };

  next();
};
