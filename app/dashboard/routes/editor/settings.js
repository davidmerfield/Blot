var parseBody = require('body-parser').urlencoded({extended:false});
var Template = require("template");
var helper = require('helper');
var formJSON = helper.formJSON;

var loadTemplate = require('./loadTemplate');
var loadSidebar = require('./loadSidebar');
var Blog = require('blog');

module.exports = function (server) {

  server.route('/template/:template/settings')

    // Ensure the viewer is logged in and
    // owns a template with that name.
    .all(loadTemplate, loadSidebar)

    .get(function(req, res){

      res.locals.partials.yield = 'template/settings';
      res.render('template');
    })

    // Handle deletions...
    .post(parseBody)

    .post(function(req, res, next){

      if (!req.body.delete) return next();

      var blogID = req.blog.id;
      // makeSlug is called twice (stupidly, accidentally)
      // in the process to create a template. This double encodes
      // certain characters like ø. It means that we need to run
      // makeSlug twice when looking up a template by its slug.
      // makeID calls makeSlug under the hood so we only need
      // to call it once ourselves.
      var name = helper.makeSlug(req.params.template);
      var designPage = '/settings/theme';

      Template.drop(blogID, name, function(err) {

        if (err) return next(err);

        res.message(designPage, 'The template ' + name + ' was deleted');
      });
    })

    .post(function(req, res, next){

      var metadata = formJSON(req.body, Template.model.metadata);

      remove(metadata, ['id', 'slug', 'owner', 'isPublic', 'cloneFrom', 'thumb']);

      // Validate real info
      metadata.name = metadata.name.slice(0, 50);
      metadata.locals = metadata.locals || {};

      // Make sure the locals are pretty
      for (var i in metadata.locals) {
        var val = i;
        val = val.split('{').join('');
        val = val.split('}').join('');
        val = val.split(' ').join('_');
        val = val.trim();
        if (val !== i) {
          metadata.locals[val] = metadata.locals[i];
          delete metadata.locals[i];
        }
      }

      Template.update(req.blog.id, req.template.slug, metadata, function (err){

        if (err) return next(err);

        if (metadata.localEditing) Template.writeToFolder(req.blog.id, req.template.id, function(){});

        Blog.flushCache(req.blog.id, function(err){

          if (err) return next(err);

          res.message(req.path, 'Changes to your template were made successfully!');
        });
      });
    });


  function remove (obj, list) {
    for (var i in list)
      delete obj[list[i]];
  }

};