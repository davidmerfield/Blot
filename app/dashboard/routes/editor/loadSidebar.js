var Template = require("template");
var helper = require('helper');
var arrayify = helper.arrayify;
var mime = require('mime');

var getViews = Template.getAllViews;

var arePartials = ['head', 'header', 'footer'];
var areAssets = ['text/css', 'application/javascript'];
var arePartials = ['head', 'header', 'footer'];

module.exports = function(req, res, next) {

  var templateID = req.template.id;
  var viewName = req.params.view;

  getViews(templateID, function(err, views, template){

    if (err || !views || !template)
      return next(new Error('No template'));

    var extras = [];
    var partials = [];
    var assets = [];
    var base = '/template/' + template.slug + '/view';

    views = arrayify(views, function (view) {

      view.extension = mime.extension(view.type || '');
      view.editorMode = editorMode(view);
      view.fullName = view.name + '.' + view.extension;
      view.url = base + '/' + view.name + '/editor';

      // Load the first view if none selected
      if (viewName === null) viewName = view.name;

      if (arePartials.indexOf(view.name) > -1) {
        partials.push(view);
        return false;
      }
    });

    views = sort(views);
    partials = sort(partials);

    var sidebar = [];

    for (var i = 0; i < views.length;i++)
      sidebar.push(views[i]);

    sidebar.push({title: 'Partials', is_title: true});

    for (var i = 0; i < partials.length;i++)
      sidebar.push(partials[i]);

    sidebar.forEach(function(link){
      if (link.name === req.params.view) link.active = 'active';
    });

    res.locals.partials.sidebar = 'template/_sidebar';
    res.locals.sidebar = sidebar;
    next();
  });
};

function sort (arr){

  return arr.sort(function(a,b) {

    if (a.name < b.name)
       return -1;

    if (a.name > b.name)
      return 1;

    return 0;
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