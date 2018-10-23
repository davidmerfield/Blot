var helper = require("helper");
var arrayify = helper.arrayify;
var Template = require("template");
var extendTemplate = require("./extendTemplate");

module.exports = function(req, res, next) {
  Template.list(req.blog.id, function(err, templates) {
    // Turn the dictionary of templates returned
    // from the DB into a list that Mustache can render
    templates = arrayify(templates, extendTemplate(req, res));

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

    res.locals.templates = {
      yours: templates.filter(function(t) {
        return t.isMine;
      }),
      blots: templates.filter(function(t) {
        return !t.isMine;
      })
    };

    res.locals.templates.blots = res.locals.templates.blots.slice(0,7);
    
    next();
  });
};
