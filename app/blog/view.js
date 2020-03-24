module.exports = function(server) {
  var Template = require("template");

  server.use(function(request, response, next) {
    var blog = request.blog,
      templateID = blog.template,
      url = request.url;

    Template.getViewByURL(templateID, url, function(err, viewName) {
      if (err) return next(err);

      if (viewName) return response.renderView(viewName, next);

      Template.getViewByRoute(templateID, url, function(err, viewName, params) {
        if (err) return next(err);

        if (params) request.params = params;
        if (viewName) return response.renderView(viewName, next);

        return next();
      });
    });
  });
};
