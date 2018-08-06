module.exports = function(req, res, next) {
  
  res.locals.partials = res.locals.partials || {};
  res.locals.partials.head = __dirname + "/views/partials/head";
  res.locals.partials.footer = __dirname + "/views/partials/footer";

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

    res.locals.partials.yield = view;
    _render.call(this, wrapper, locals, callback);      
  };

  next();
};
