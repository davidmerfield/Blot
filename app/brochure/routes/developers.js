var Express = require("express");
var developers = new Express.Router();

developers.get("/", function(req, res) {
  res.locals.layout = 'developers/layout';
  res.locals.title = "Blot / Developers";
  res.render("developers");
});

module.exports = developers;