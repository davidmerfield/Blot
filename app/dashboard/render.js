module.exports = function(req, res, next) {
  res.locals.partials = res.locals.partials || {};

  res.locals.partials.head = "partials/head";
  res.locals.partials.header = "partials/header";
  res.locals.partials.footer = "partials/footer";
  res.locals.partials.nav = "partials/nav";

  var _render = res.render;
  var wrapper;
  
  res.render = function(view, locals, callback) {
    if (view.indexOf("account/") > -1) {
      wrapper = "account/wrapper";
    } else {
      wrapper = "partials/wrapper";
    }

    res.locals.partials.yield = view;

    _render.call(this, wrapper, locals, callback);
  };

  next();
};
