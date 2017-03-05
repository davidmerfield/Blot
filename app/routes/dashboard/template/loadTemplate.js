var Template = require("../../../models/template");
var config = require('../../../../config');
var helper = require('../../../helper');
var arrayify = helper.arrayify;

module.exports = function (req, res, next) {

  var blogID = req.blog.id;
  var name = req.params.template;

  if (!name) return res.redirect('/settings/design');

  var templateID = Template.makeID(blogID, name);

  // This should probably be Template.owns(blogID, templateid)
  Template.isOwner(blogID, templateID, function(err, isOwner){

    // Check the blog owns the template
    if (err || !isOwner) return res.redirect('/settings/design');

    Template.getMetadata(templateID, function(err, template){

      if (template.localEditing && req.path !== '/template/'  + req.params.template + '/local-editing') {
        return res.redirect('/template/' + req.params.template +'/local-editing');
      }

      template.locals = arrayify(template.locals);

      req.template = template;

      template.preview = ['http://preview.my', template.slug, req.blog.handle, config.host].join('.');

      res.addLocals({template: template});

      res.addPartials({
        local: 'template/_local',
        locals: 'template/_locals',
        partial: 'template/_partial',
        partials: 'template/_partials',
      });

      return next();
    });
  });
};
