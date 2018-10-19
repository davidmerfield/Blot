module.exports = function(server) {
  var Template = require("template");

  server.use(function(req, res, next) {
    var blog = req.blog,
      templateID = blog.template,
      url = req.url;

    Template.view.getNameByUrl(templateID, url, function(err, viewName) {
      if (err) return next(err);

      if (!viewName) return next();

      res.renderView(viewName, next);
    });
  });
};
