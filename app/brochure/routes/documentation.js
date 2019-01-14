var Express = require("express");
var documentation = new Express.Router();

documentation.use(function(req, res, next){
  res.locals.base = '/documentation';
  res.locals.layout = 'documentation/layout';
  next();
});

documentation.get("/", function(req, res) {
  res.locals.title = "Blot – Documentation";
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