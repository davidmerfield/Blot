var eachView = require('../each/view');
var Template = require('../../app/models/template');

eachView(function(user, blog, template, view, next){

  // We update every view so that new retrieveables
  // (like formatDate) are retrieved.
  Template.setView(template.id, view, next);

}, process.exit);
