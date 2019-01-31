var checkToken = require("./checkToken");
var checkEmail = require("./checkEmail");
var checkReset = require("./checkReset");
var checkPassword = require("./checkPassword");
var LogInError = require("./logInError");
// Error codes & their corresponding message
var parse = require("body-parser").urlencoded({ extended: false });

var Express = require("express");
var form = new Express.Router();

var logIn = form.route("/");

logIn.all(function(req, res, next) {
  if (req.session && req.session.uid && !req.query.token)
    return res.redirect("/");

  if (req.session) {
  }

  res.locals.title = "Log in";
  res.locals.layout = "log-in/layout";

  return next();
});

logIn.all(require("./rateLimit"));

logIn.get(checkToken, function(req, res) {
  res.render("log-in");
});

logIn.post(parse, checkEmail, checkReset, checkPassword);

logIn.all(function(err, req, res, next) {
  if (!(err instanceof LogInError)) {
    console.log(err);
    return next(err);
  }

  res.locals.error = res.locals[err.code] = true;
  res.locals.email = req.body && req.body.email;
  res.status(403);

  if (err.code === "BADPASSWORD" || err.code === "NOPASSWORD") {
    return res.render("log-in/password");
  }

  return res.render("log-in");
});

module.exports = form;
