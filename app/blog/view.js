module.exports = function (server) {
  var Template = require("models/template");

  server.use(function (request, response, next) {
    var blog = request.blog,
      templateID = blog.template,
      url = request.url;

    Template.getViewByURL(templateID, url, function (err, viewName) {
      if (err) return next(err);

      if (viewName) return response.renderView(viewName, next);

      return next();
    });
  });
};
