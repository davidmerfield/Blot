var writeToFolder = require('../../app/modules/template').writeToFolder;
var eachTemplate = require('../each/template');
var _ = require('lodash');

var eachView = require('../each/view');
var Template = require('../../app/models/template');
var helper = require('helper');
var type = helper.type;

var DESCRIPTION = '{{pageDescription}}';
var FIXED_DESCRIPTION = '{{> description}}';

var TITLE = '{{pageTitle}}';
var FIXED_TITLE = '{{> title}}';

var changedTemplate = {};

eachView(function(user, blog, template, view, next){

  if (!view || !view.content) return next();

  var _view = _.cloneDeep(view);

  view.partials = view.partials || {};

  if (type(view.partials, 'array')) {

    var partials = {};

    for (var i = 0; i < view.partials.length;i++)
      partials[view.partials[i]] = null;

    view.partials = partials;
  }

  if (view.content.indexOf(DESCRIPTION) > -1) {
    view.content = view.content.split('{' + DESCRIPTION + '}').join(DESCRIPTION);
    view.content = view.content.split(DESCRIPTION).join(FIXED_DESCRIPTION);
  }

  if (view.content.indexOf(TITLE) > -1) {
    view.content = view.content.split('{' + TITLE + '}').join(TITLE);
    view.content = view.content.split(TITLE).join(FIXED_TITLE);
  }

  if (view.locals.pageDescription) {
    view.partials.description = view.locals.pageDescription;
    delete view.locals.pageDescription;
  }

  if (view.locals.pageTitle) {
    view.partials.title = view.locals.pageTitle;
    delete view.locals.pageTitle;
  }

  if (_.isEqual(_view, view)) return next();

  changedTemplate[template.id] = true;

  console.log('Changed', template.id);

  Template.setView(template.id, view, next);

}, function(){

  eachTemplate(function(user, blog, template, next) {

    if (!template.localEditing) return next();

    if (!changedTemplate[template.id]) return next();

    console.log('Would write local for this tmeplate');

    writeToFolder(blog.id, template.id, function(err){

      if (err) console.log(err);

      next();
    });
  }, process.exit);
});
