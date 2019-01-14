var Express = require("express");
var signUp = new Express.Router();

signUp.get('/', function(req, res){
  res.locals.title = "Blot / Sign up";
  res.locals.layout = 'partials/sign-up-layout';
  res.render("sign-up");
});

module.exports = signUp;