var Template = require('../app/models/template');
var eachTemplate = require('./each/template');

eachTemplate(function(user, blog, template, next){

  var locals = template.locals;

  locals.page_size = locals.page_size || blog.pageSize || 5;

  console.log(blog.id, template.id, 'page size:', locals.page_size);

  Template.setMetadata(template.id, {locals: locals}, function(err){

    if (err) throw err;

    next();
  });
}, process.exit);