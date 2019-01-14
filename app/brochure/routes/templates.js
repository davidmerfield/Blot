var Express = require("express");
var templates = new Express.Router();

templates.get("/", function(req, res) {
  res.locals.title = "Blot – Templates";
  res.render("templates");
});

templates.get("/:template", function(req, res) {
  res.locals.title = "Blot – Templates";
  res.render("templates/" + req.params.template);
});

module.exports = templates;