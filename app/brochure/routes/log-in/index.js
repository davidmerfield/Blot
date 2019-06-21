var BodyParser = require("body-parser");
var Express = require("express");

var checkToken = require("./checkToken");
var checkReset = require("./checkReset");
var checkEmail = require("./checkEmail");
var checkPassword = require("./checkPassword");
var errorHandler = require("./errorHandler");
var parse = BodyParser.urlencoded({ extended: false });

var form = new Express.Router();

// form.use(require("./rateLimit"));

form.use(function(req, res, next) {
  // Send logged-in users to the dashboard
  if (req.session && req.session.uid && !req.query.token) {
    var then = req.query.then || (req.body && req.body.then) || "/";
    return res.redirect(then);
  }

  res.header("Cache-Control", "no-cache");
  res.locals.title = "Log in";
  res.locals.layout = "partials/layout-form";

  return next();
});

form
  .route("/reset")

  .get(function(req, res) {
    res.render("log-in/reset");
  })

  .post(parse, checkEmail, checkReset, errorHandler)

  .post(function(err, req, res, next) {
    res.render("log-in/reset");
  });

form
  .route("/")
  .get(checkToken, function(req, res) {
    res.render("log-in");
  })

  .post(parse, checkEmail, checkReset, checkPassword, errorHandler)

  .post(function(err, req, res, next) {
    if (req.body && req.body.reset !== undefined)
      return res.redirect("/log-in/reset");

    res.render("log-in");
  });

module.exports = form;
