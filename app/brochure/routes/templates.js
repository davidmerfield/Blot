var Express = require("express");
var templates = new Express.Router();

templates.use(function(req, res, next) {
  res.locals.layout = "templates/layout";
  res.locals.selected = {};
  next();
});

templates.param("template", function(req, res, next) {
  res.locals.selected[req.params.template] = "selected";
  next();
});

templates.get("/", function(req, res) {
  res.locals.title = "Blot – Templates";
  res.render("templates");
});

templates.get("/:template", function(req, res) {
  res.locals.title = "Blot – Templates";
  res.render("templates/" + req.params.template);
});

module.exports = templates;
