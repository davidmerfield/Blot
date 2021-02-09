var eachTemplate = require('../each/template');
var Template = require('models/template');

eachTemplate(function(user, blog, template, next){

  // Template.setMetadata(template.id, template, cb)

  return next();

}, process.exit);
