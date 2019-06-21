var helper = require("helper");
var Email = helper.email;
var format = require("url").format;
var User = require("user");
var NOTOKEN = "Could not generate a token";
var config = require("config");
var generateAccessToken = User.generateAccessToken;
var checkToken = require("./checkToken");
var checkEmail = require("./checkEmail");
var checkPassword = require("./checkPassword");
var LogInError = require("./logInError");
// Error codes & their corresponding message
var parse = require("body-parser").urlencoded({ extended: false });

var Express = require("express");
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

  .post(checkEmail, checkReset, errorHandler)

  .post(function(err, req, res, next) {
    res.render("log-in/reset");
  });

function checkReset(req, res, next) {
  var user = req.user;
  var hasPassword = user.passwordHash !== "";
  var reset = req.body && req.body.reset !== undefined;

  // Some users have not yet set up a password
  // so we might need to send them a link even
  // if they did not click the reset button
  if (!reset && hasPassword) return next();

  sendPasswordResetEmail(user.uid, function(err) {
    if (err) return next(err);

    res.locals.sent = true;
    res.locals.hasPassword = hasPassword;
    res.render("log-in/reset");
  });
}

function sendPasswordResetEmail(uid, callback) {
  var url;

  generateAccessToken(uid, function(err, token) {
    if (err || !token) return callback(err || new Error(NOTOKEN));

    // The full one-time log-in link to be sent to the user
    url = format({
      protocol: "https",
      host: config.host,
      pathname: "/log-in",
      query: {
        token: token,
        then: "/account/password/set"
      }
    });

    Email.SET_PASSWORD(uid, { url: url }, callback);
  });
}

form
  .route("/")
  .get(checkToken, function(req, res) {
    res.render("log-in");
  })

  .post(parse, checkEmail, checkReset, checkPassword, errorHandler)

  .post(function(err, req, res, next) {
    if (req.body && req.body.reset !== undefined)
      return res.redirect("/log-in/reset");

    console.log("LOCALS:", res.locals);
    res.render("log-in");
  });

function errorHandler(err, req, res, next) {
  if (!(err instanceof LogInError)) {
    console.log(err);
    return next(err);
  }

  res.locals.error = res.locals[err.code] = true;
  res.locals.email = req.body && req.body.email;
  res.status(403);

  next(err);
}
module.exports = form;
