module.exports = function(server) {
  var Template = require("template");

  server.use(function(request, response, next) {
    var blog = request.blog,
      templateID = blog.template,
      url = request.url;

    console.log("getting view", url);

    Template.getViewByURL(templateID, url, function(err, viewName) {
      if (err) return next(err);
      if (!viewName) return next();

      console.log("rendering view", viewName);
      response.renderView(viewName);
    });
  });
};
