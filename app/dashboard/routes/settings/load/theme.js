var helper = require("helper");
var arrayify = helper.arrayify;
var previewHost = "http://preview";
var ignored = ["blank", "monotone", "mono", "original", "serif"];
var config = require("config");
var Template = require("template");

module.exports = function(req, res, next) {
  var blog = req.blog,
    blogID = blog.id,
    currentTemplate = blog.template,
    defaultTemplate = Template.defaultTemplate;

  Template.getTemplateList(blogID, function(err, templates) {
    var yourTemplates = [];
    var blotTemplates = [];

    // Turn the dictionary of templates returned
    // from the DB into a list that Mustache can render
    templates = arrayify(templates, function(template) {
      template.nameLower = template.name.toLowerCase();

      if (template.owner === blog.id) template.isMine = true;

      if (template.id === defaultTemplate) template.isDefault = true;

      if (template.id === currentTemplate) template.checked = "checked";

      if (
        !template.checked &&
        ignored.indexOf(template.name.toLowerCase()) > -1
      )
        return false;

      var mySubDomain = template.isMine ? "my." : "";

      template.editURL = "/template/" + template.slug;

      template.previewURL =
        previewHost +
        "." +
        mySubDomain +
        template.slug +
        "." +
        blog.handle +
        "." +
        config.host;

      if (template.owner === blogID) yourTemplates.push(template);

      if (template.owner !== blogID) blotTemplates.push(template);
    });

    // Sort templates alphabetically,
    // with my templates above site tmeplates
    templates.sort(function(a, b) {
      if (a.isMine && !b.isMine) return -1;

      if (b.isMine && !a.isMine) return 1;

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
