var Template = require("models/template");

module.exports = function (req, res, next) {
  Template.getMetadata(req.blog.template, function (err, template) {
    res.locals.template = template;
    next();
  });
};
