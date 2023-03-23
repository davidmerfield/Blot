var Template = require("models/template");
var makeSlug = require("helper/makeSlug");

module.exports = function (req, res, next) {
  // makeSlug is called twice (stupidly, accidentally)
  // in the process to create a template. This double encodes
  // certain characters like ø. It means that we need to run
  // makeSlug twice when looking up a template by its slug.
  // makeID calls makeSlug under the hood.
  var templateID = Template.makeID(
    req.blog.id,
    makeSlug(req.params.templateSlug)
  );

  Template.getMetadata(templateID, function (err, template) {
    if (err) return next(err);

    req.template = res.locals.template = template;
    next();
  });
};
