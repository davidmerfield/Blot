var helper = require("helper");
var User = require("user");
var Email = helper.email;
var format = require("url").format;
var NOTOKEN = "Could not generate a token";
var config = require("config");
var generateAccessToken = User.generateAccessToken;

module.exports = function checkReset(req, res, next) {
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
};

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
