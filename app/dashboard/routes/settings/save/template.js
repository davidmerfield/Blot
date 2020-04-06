var Blog = require("blog");
var Template = require("template");

module.exports = function(req, res, next) {
  var templateID = req.body.template;
  var blogID = req.blog.id;

  if (templateID === "")
    return Blog.set(blogID, { template: "" }, function(err) {
      res.message("/settings/theme", "Disabled your template");
    });

  // Blog selected a new template
  if (templateID && templateID === req.blog.template)
    return res.redirect(req.path);

  var updates = { template: templateID };

  Template.getMetadata(templateID, function(err, template) {
    if (err || !template) return next(err || new Error("No template"));

    Blog.set(blogID, updates, function(errors, changed) {
      if (errors && errors.template) {
        res.message(req.path, new Error(errors.template));
      } else if (changed.indexOf("template") > -1) {
        res.message(req.path, "Changed your template to " + template.name);
      }
    });
  });
};
