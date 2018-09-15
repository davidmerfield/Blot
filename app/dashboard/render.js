module.exports = function(req, res, next) {
  var _render = res.render;
  var wrapper;

  res.render = function(view, locals, callback) {

    if (view === "error") {
      return _render.call(this, view, locals, callback);
    }

    if (view.indexOf('sign-up') > -1 || view.indexOf('log-in') > -1) {

      console.log('HERE');
      
      res.locals.partials.yield = view;

      wrapper = __dirname + "/views/partials/wrapper-public.html";

      return _render.call(this, wrapper, locals, callback);
    }


    if (view.indexOf('create-blog') > -1 || view.indexOf('wrapper-setup') > -1) {
      return _render.call(this, view, locals, callback);
    }

    if (view.indexOf("account/") > -1) {
      wrapper = __dirname + "/views/account/wrapper.html";
    } else if (req.query.setup) 
      wrapper = __dirname + "/views/partials/wrapper-setup.html";
    else {
      wrapper = __dirname + "/views/partials/wrapper.html";
    }

    if (view === "_static_wrapper") {

      wrapper = __dirname + "/views/partials/static_wrapper.html";

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
      res.locals.partials.yield = view;
    }

    _render.call(this, wrapper, locals, callback);
  };

  next();
};
