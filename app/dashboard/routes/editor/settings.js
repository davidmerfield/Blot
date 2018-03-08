var parseBody = require('body-parser').urlencoded({extended:false});
var Template = require("template");
var helper = require('helper');
var formJSON = helper.formJSON;
var model = Template.metadataModel;
var save = Template.update;
var disk_cache = require('disk_cache');

var writeToFolder = require('../../../modules/template').writeToFolder;
var loadTemplate = require('./loadTemplate');
var loadSidebar = require('./loadSidebar');
var error = require('./error');

module.exports = function (server) {

  server.route('/template/:template/settings')

    // Ensure the viewer is logged in and
    // owns a template with that name.
    .all(loadTemplate, loadSidebar)

    .get(function(req, res){

      res.setPartials({
        yield: 'template/settings'
      });

      res.render('template');
    })

    // Handle deletions...
    .post(parseBody)

    .post(function(req, res, next){

      if (!req.body.delete) return next();

      var blogID = req.blog.id;
      var name = req.params.template;
      var designPage = '/theme';

      Template.drop(blogID, name, function(err) {

        if (err) return next(err);

        res.message({success: 'The template ' + name + ' was deleted', url: designPage});
        res.redirect(designPage);
      });
    })

    .post(function(req, res, next){

      var metadata = formJSON(req.body, model);

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

      save(req.blog.id, req.template.slug, metadata, function (err){

        if (err) return next(err);

        if (metadata.localEditing) writeToFolder(req.blog.id, req.template.id, function(){});

        disk_cache.flushByBlogID(req.blog.id);

        res.message({success: 'Changes to your template were made successfully!'});
        res.redirect(req.path);
      });
    })

    .all(error);

  function remove (obj, list) {
    for (var i in list)
      delete obj[list[i]];
  }

};