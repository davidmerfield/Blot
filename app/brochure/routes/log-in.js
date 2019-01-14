var Express = require("express");
var logIn = new Express.Router();

logIn.get("/", function(req, res) {
  res.locals.title = "Blot / Log in";
  res.locals.layout = 'partials/log-in-layout';
  res.render("log-in");
});

module.exports = logIn;
