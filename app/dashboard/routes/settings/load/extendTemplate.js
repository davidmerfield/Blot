var previewHost = "http://preview";
var ignored = ["blank", "monotone", "mono", "original", "serif"];
var config = require("config");
module.exports = function(req, res) {
  return function(template) {
    if (!template) return template;
    
    template.nameLower = template.name.toLowerCase();

    if (template.owner === req.blog.id) template.isMine = true;

    if (template.id === "SITE:default") template.isDefault = true;

    if (template.id === req.blog.template) {
      template.checked = "checked";
      res.locals.template = template;
    }

    if (!template.checked && ignored.indexOf(template.name.toLowerCase()) > -1)
      return false;

    var mySubDomain = template.isMine ? "my." : "";

    template.editURL = "/template/" + template.slug;

    template.previewURL =
      previewHost +
      "." +
      mySubDomain +
      template.slug +
      "." +
      req.blog.handle +
      "." +
      config.host;
    
    return template;
  };
};
