var Template = require("template");
var config = require('config');
var helper = require('helper');
var arrayify = helper.arrayify;

module.exports = function (req, res, next) {

  var blogID = req.blog.id;

  // makeSlug is called twice (stupidly, accidentally)
  // in the process to create a template. This double encodes
  // certain characters like ø. It means that we need to run
  // makeSlug twice when looking up a template by its slug.
  // makeID calls makeSlug under the hood so we only need
  // to call it once ourselves.
  var name = helper.makeSlug(req.params.template);

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

      template.baseUrl = "/template/" + encodeURIComponent(template.slug);
      template.preview = ['http://preview.my', template.slug, req.blog.handle, config.host].join('.');

      res.locals.template = template;
      res.locals.partials.head = 'partials/head';
      res.locals.partials.footer = 'partials/footer';
      res.locals.partials.local = 'template/_local';
      res.locals.partials.locals = 'template/_locals';
      res.locals.partials.partial = 'template/_partial';
      res.locals.partials.partials = 'template/_partials';

      return next();
    });
  });
};
