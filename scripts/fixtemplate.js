var eachView = require('./each/view');
var helper = require('helper');
var ensure = helper.ensure;
var Template = require('../app/models/template');
var type = helper.type;
var forEach = helper.forEach;
var _ = require('lodash');

function fixView (template, view, callback) {

  if (type(view.partials, 'object')) {

    ensure(template, Template.metadataModel)
      .and(view, Template.viewModel);

    return callback();
  }

  if (type(view.partials, 'array') && !_.isEqual(view.partials, [])) {
    throw 'there is something inside';
  }

  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('Need to fix', template.name);
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!');

  Template.setView(template.id, {name: view.name, partials: {}}, function(err){

    if (err) throw err;

    Template.getView(template.id, view.name, function(err, view){

      if (err) throw err;

      ensure(template, Template.metadataModel)
        .and(view, Template.viewModel);

      callback();
    });
  });
}

Template.getTemplateList('1', function(err, res){

  if (err) throw err;

  forEach(res, function(template, nextTemplate){

    if (template.owner !== 'SITE') return nextTemplate();

    Template.getAllViews(template.id, function(err, allviews){

      forEach(allviews, function(key, view, nextView){

        fixView(template, view, nextView);

      }, function(){

        nextTemplate();
      });
    });
  }, function(){

    eachView(function(user, blog, template, view, nextView){

      fixView(template, view, nextView);

    }, process.exit);
  });
});

