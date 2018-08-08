module.exports = function(req, res, next) {
  var _render = res.render;
  var wrapper;

  res.render = function(view, locals, callback) {
    if (view === "error") {
      return _render.call(this, view, locals, callback);
    }

    if (view.indexOf("account/") > -1) {
      wrapper = __dirname + "/views/account/wrapper.html";
    } else {
      wrapper = __dirname + "/views/partials/wrapper.html";
    }

    if (view === "_static_wrapper") {

      wrapper = __dirname + "/views/partials/static_wrapper.html";

      if (
        res.locals.partials.yield &&
        (res.locals.partials.yield.indexOf("help") > -1 ||
          res.locals.partials.yield.indexOf("config") > -1 ||
          res.locals.partials.yield.indexOf("account") > -1)
      ) {
        res.locals.partials.sidebar = __dirname + "/views/partials/sidebar";
      }
      
    } else {
      res.locals.partials.yield = view;
    }

    console.log(wrapper, res.locals.partials);

    _render.call(this, wrapper, locals, callback);
  };

  next();
};
