var Template = require("template");
var config = require("config");
var helper = require("helper");
var arrayify = helper.arrayify;

module.exports = function(req, res, next) {
  var templateID;

  try {
    // makeSlug is called twice (stupidly, accidentally)
    // in the process to create a template. This double encodes
    // certain characters like ø. It means that we need to run
    // makeSlug twice when looking up a template by its slug.
    // makeID calls makeSlug under the hood so we only need
    // to call it once ourselves. Update: I was retarded.
    templateID = req.blog.id + ":" + helper.makeSlug(req.params.template);
  } catch (err) {
    return next(err);
  }

  Template.get(templateID, function(err, template) {
    if (err || !template) {
      return next(err || new Error("No template"));
    }

    // Verify the blog controls the template to delete
    if (template.owner !== req.blog.id) {
      return next(new Error("No permission to edit this template"));
    }

    if (
      template.localEditing &&
      req.path !== "/template/" + req.params.template + "/local-editing"
    ) {
      return res.redirect(
        "/template/" + req.params.template + "/local-editing"
      );
    }

    template.locals = arrayify(template.locals);

    req.template = template;

    template.baseUrl = "/template/" + encodeURIComponent(template.slug);
    template.preview = [
      "http://preview.my",
      template.slug,
      req.blog.handle,
      config.host
    ].join(".");

    res.locals.template = template;
    res.locals.partials.head = "partials/head";
    res.locals.partials.footer = "partials/footer";
    // res.locals.partials.local = "template/_local";
    res.locals.partials.locals = "template/_locals";
    res.locals.partials.partial = "template/_partial";
    res.locals.partials.partials = "template/_partials";

    return next();
  
  });
};
