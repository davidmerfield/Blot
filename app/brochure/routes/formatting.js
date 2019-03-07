var Express = require("express");
var formatting = new Express.Router();
var tex = require('./tools/tex');

formatting.use(tex);

formatting.use(function(req, res, next){
  res.locals.layout = 'formatting/layout';
  next();
});

formatting.get("/", function(req, res) {
  res.locals.title = "Blot – Formatting";
  res.render("formatting");
});

formatting.get("/:section", function(req, res) {
  res.render("formatting/" + req.params.section);
});

module.exports = formatting;