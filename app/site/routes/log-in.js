// Error codes & their corresponding message
var NOTOKEN = 'Could not generate a token';

var format = require('url').format;
var parse = require('body-parser').urlencoded({extended:false});
var Express = require('express');
var User = require('user');
var Email = require('email');
var config = require('config');

// stores state locally, don't use this in production
// var brute = require('express-brute');
// var store = new brute.MemoryStore();
// var limiter = new brute(store);

var login = Express.Router();
var form = login.route('/');

form.get(checkToken, function(req, res){
  res.render('log-in-email');
});

form.post(parse, checkEmail, checkReset, checkPassword);

form.all(errorHandler);

function checkToken (req, res, next) {

  var token = req.query && req.query.token;
  var then = (req.query && req.query.then) || '/';

  if (!token) return next();

  User.checkAccessToken(token, function(err, uid){

    if (err || !uid) return next(new LogInError('BADTOKEN'));

    User.getById(uid, function(err, user){

      if (err || !user) return next(new LogInError('NOUSER'));

      User.generateAccessToken(uid, function(err, token){

        if (err) return next(err);

        if (then) then += '?token=' + token;

        authenticate(req, user);
        res.redirect(then);
      });
    });
  });
}

function checkEmail (req, res, next) {

  var email = req.body && req.body.email;

  if (!email) return next(new LogInError('NOEMAIL'));

  res.locals.email = email;

  User.getByEmail(email, function(err, user){

    if (err) return next(err);

    // The supplied email address does not
    // match a user in our database.
    if (!user) return next(new LogInError('BADEMAIL'));

    req.user = user;

    next();
  });
}

function checkReset (req, res, next) {

  var url;
  var user = req.user;
  var hasPassword = user.passwordHash !== '';
  var reset = req.body && req.body.reset !== undefined;

  // Some users have not yet set up a password
  // so we might need to send them a link even
  // if they did not click the reset button
  if (!reset && hasPassword) return next();

  User.generateAccessToken(user.uid, function(err, token){

    if (err || !token) return next(err || new Error(NOTOKEN));

    // The full one-time log-in link to be sent to the user
    url = format({
      protocol: 'https',
      host: config.host,
      pathname: req.baseUrl,
      query: {
        token: token,
        then: '/account/set-password'
      }
    });

    Email.SET_PASSWORD(user.uid, {url: url}, function(err){

      if (err) return next(err);

      res.locals.hasPassword = hasPassword;
      res.render('log-in-reset');
    });
  });
}

function checkPassword (req, res, next) {

  var user = req.user;
  var password = req.body && req.body.password;
  var then = (req.query && req.query.then) || '/';

  if (!user.passwordHash) {
    res.locals.hasPassword = true;
    return res.render('log-in-reset');
  }

  if (password === '') {
    return next(new LogInError('NOPASSWORD'));
  }

  if (password === undefined) return res.render('log-in-password');

  User.checkPassword(user.uid, password, function(err, match){

    if (err) return next(err);

    if (!match) return next(new LogInError('BADPASSWORD'));

    authenticate(req, user);

    return res.redirect(then );
  });
}

function authenticate (req, user) {
  req.session.uid = user.uid;
  req.session.blogID = user.lastSession;
}

function errorHandler (err, req, res, next){

  if (!(err instanceof LogInError)) {
    console.log(err);
    return next(err);
  }

  res.locals.error = res.locals[err.code] = true;
  res.locals.email = req.body && req.body.email;
  res.status(403);

  if (err.code === 'BADPASSWORD' || err.code === 'NOPASSWORD')
    return res.render('log-in-password');

  res.render('log-in-email');
}

function LogInError (code, message) {
  this.name = "LogInError";
  this.message = message || "";
  this.code = code || ""
}

LogInError.prototype = new Error();

module.exports = login;