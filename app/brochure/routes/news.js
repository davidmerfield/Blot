var Express = require("express");
var news = new Express.Router();

news.get("/", function(req, res) {
  res.locals.title = "Blot / News";
  res.render("news");
});

module.exports = news;