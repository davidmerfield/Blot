var Express = require("express");
var formatting = new Express.Router();

formatting.get("/", function(req, res) {
  res.locals.title = "Blot – Formatting";
  res.render("formatting");
});

module.exports = formatting;