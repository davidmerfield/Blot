var Template = require("template");
var extendTemplate = require("./extendTemplate");

module.exports = function(req, res, next) {
  var templateID;

  try {
    templateID = decodeURIComponent(req.params.template);
  } catch (err) {
    return next(err);
  }

  console.log('here', templateID);
  
  if (templateID.indexOf("yours/") === 0) {
    templateID = req.blog.id + ":" + templateID;
  } else {
    templateID = "SITE:" + templateID;
  }

  Template.get(templateID, function(err, template) {
    if (err) {
      return next(err);
    }

    req.template = extendTemplate(req, res)(template);
    res.locals.template = template;

    return next();
  });
};
