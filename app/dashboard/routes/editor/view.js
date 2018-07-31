var parseBody = require('body-parser').urlencoded({extended:false});
var Blog = require("blog");
var Template = require("template");
var helper = require('helper');
var getView = Template.getView;
var mime = require('mime');

var loadTemplate = require('./loadTemplate');
var loadSidebar = require('./loadSidebar');

var extend = helper.extend;

var error = require('./error');

var get = Template.getView;
var set = Template.setView;
var drop = Template.dropView;

var parseName = require('./parseName');
var formJSON = helper.formJSON;
var capitalise = helper.capitalise;
var model = Template.viewModel;
var arrayify = helper.arrayify;

module.exports = function (server) {

  server.route('/template/:template/view')

    // Ensure the viewer is logged in and
    // owns a template with that name.
    .all(loadTemplate, loadSidebar)

    .get(function(req, res){
      res.locals.partials.yield = 'template/view-create';
      res.render('template');
    })

    .post(parseBody, parseName, function(req, res, next){

      var view = formJSON(req.body, model);

      Template.setView(req.template.id, view, function(err){

        if (err) return next(err);

        var url = req.path + '/' + view.name + '/editor';

        res.message({success: 'Created new view!', url: url});
        res.redirect(url);
      });
    })

    .all(error);

  server.route('/template/:template/view/:view/editor')

    // Ensure the viewer is logged in and
    // owns a template with that name.
    .all(loadTemplate, loadSidebar, loadView)

    .get(function(req, res){

      res.locals.partials.yield = 'template/view-editor';

      res.render('template', {
        active:{editor: true},
        title: capitalise(res.locals.view.name + '.' + res.locals.view.extension) + ' - ' + req.template.name
      });
    })

    .post(parseBody, saveView)

    .all(error);

  server.route('/template/:template/view/:view/settings')

    // Ensure the viewer is logged in and
    // owns a template with that name.
    .all(loadTemplate, loadSidebar, loadView)

    .get(function(req, res){

      res.locals.partials.yield = 'template/view-settings';


      res.render('template', {
        active:{settings: true},
        title: capitalise(req.view.name + '.' + req.view.extension) + ' - Settings - ' + req.template.name
      });
    })

    // Handle deletions...
    .post(parseBody, parseName)

    .post(function(req, res, next){

      if (!req.body.delete) return next();

      Template.dropView(req.template.id, req.view.name, function(err){

        if (err) return next(err);

        res.redirect('/template/'+req.template.slug+'/settings');
      });
    })

    .post(saveView)

    .all(error);

};

function saveView (req, res, next) {

  if (wasRenamed(req))
    return renameView(req, res, next);

  var view = formJSON(req.body, model);

  // This allows users to delete all the
  // locals for a view.
  if (req.body.has_locals) {
    view.locals = view.locals || {};
    view.partials = view.partials || {};
  }

  view.name = req.view.name;

  set(req.template.id, view, function(err){

    if (err) return next(err);

    var now = Date.now();

    var changes = {
      cacheID: now,
      cssURL: '/style.css?' + now,
      scriptURL: '/script.js?' + now
    };

    Blog.set(req.blog.id, changes, function(err){

      if (err) return next(err);

      Blog.flushCache(req.blog.id, function(err){
        
        if (err) return next(err);
      
        res.message({success: 'Saved changes!'});
        return res.redirect(req.path);
      });
    });
  });
}

function renameView (req, res, next) {

  var view = formJSON(req.body, model);

  view.locals = view.locals || {};

  extend(view).and(req.view);

  var newName = view.name;
  var oldName = req.params.view;

  get(req.template.id, newName, function(err, existingView){

    if (existingView && !err)
      return next(new Error('A view called ' + newName + ' already exists'));

    set(req.template.id, view, function(err){

      if (err) return next(err);

      drop(req.template.id, oldName, function(err){

        if (err) return next(err);

        var redirect = req.path;

        redirect = redirect.split('/view/' + req.params.view +'/').join('/view/' + view.name + '/');

        Blog.flushCache(req.blog.id, function(err){

          if (err) return next(err);

          res.message({success: 'Saved changes!', url: redirect});
          res.redirect(redirect);
        });
      });
    });
  });
}

function wasRenamed (req) {
  return req.view !== undefined && !!req.params.view && !!req.body.name && req.params.view !== req.body.name;
}

function loadView (req, res, next) {

  var templateID = req.template.id;
  var view = req.params.view;

  getView(templateID, view, function(err, view){

    if (err) return next(err);

    view.locals = arrayify(view.locals);

    for (var i in view.partials)
      if (view.partials[i] === null)
        delete view.partials[i];

    view.partials = arrayify(view.partials);

    view.extension = mime.extension(view.type || '');
    view.editorMode = editorMode(view);

    req.view = view;
    res.locals.view = view;
    next();
  });
}

// Determine the mode for the
// text editor based on the file extension
function editorMode (view) {

  var mode = 'xml';

  if (view.extension === 'js')
      mode = 'javascript';

  if (view.extension === 'css')
      mode = 'css';

  if (view.extension === 'txt')
      mode = 'text';

  return mode;
}