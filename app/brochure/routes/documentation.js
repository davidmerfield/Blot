var Express = require("express");
var documentation = new Express.Router();
var tex = require('./tools/tex');

// Renders TeX
documentation.use(tex);

// Renders dates dynamically
documentation.use(require('./tools/dates'));

documentation.use(function(req, res, next){
  res.locals.base = '/documentation';
  res.locals.layout = 'documentation/layout';
  res.locals.selected = {};
  next();
});

documentation.param('section', function(req, res, next){
  res.locals.selected[req.params.section] = 'selected';
  next();
});

documentation.param('subsection', function(req, res, next){
  res.locals.selected[req.params.subsection] = 'selected';
  next();
});

documentation.get("/", function(req, res) {
  res.locals.title = "Blot – Documentation";
  res.locals.selected.index = 'selected';
  res.render("documentation");
});

documentation.get('/:section', function(req, res){
  res.locals.title = "Blot – " + req.params.section;
  res.render("documentation/" + req.params.section);
});

documentation.get('/:section/:subsection', function(req, res){
  res.locals.title = "Blot – " + req.params.section + ' – ' + req.params.subsection;
  res.render("documentation/" + req.params.section + '/' + req.params.subsection);
});

module.exports = documentation;