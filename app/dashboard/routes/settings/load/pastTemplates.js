var helper = require("helper");
var arrayify = helper.arrayify;
var previewHost = "http://preview";
var config = require("config");
var Template = require("template");

module.exports = function(req, res, next) {
  Template.getTemplateList("SITE", function(err, templates) {
    templates = templates.filter(function(template) {
      return (
        !template.isMine && !template.isPublic && template.owner === "SITE"
      );
    });

    // Turn the dictionary of templates returned
    // from the DB into a list that Mustache can render
    templates = arrayify(templates, function(template) {
      template.nameLower = template.name.toLowerCase();

      template.editURL = "/template/" + template.slug;

      template.previewURL =
        previewHost +
        "." +
        template.slug +
        "." +
        req.blog.handle +
        "." +
        config.host;
    });

    // Sort templates alphabetically,
    // with my templates above site tmeplates
    templates.sort(function(a, b) {
      var aName = a.name.trim().toLowerCase();

      var bName = b.name.trim().toLowerCase();

      if (aName < bName) return -1;

      if (aName > bName) return 1;

      return 0;
    });

    res.locals.templates = templates;

    next();
  });
};
