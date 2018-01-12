// Error codes & their corresponding message
var moment = require('moment');
var parse = require('body-parser').urlencoded({extended:false});
var Express = require('express');
var User = require('user');

var client = require('client');
var Brute = require('express-brute');
var RedisStore = require('express-brute-redis');
var sendPasswordResetEmail = require('../../dashboard/routes/account/password/email');

var store = new RedisStore({
    client: client,
    prefix: 'brute:'
});

var limiter = new Brute(store, {
  freeRetries: 200, // max # of access to log in pages per day
  failCallback: onLimit,
});

var login = Express.Router();
var form = login.route('/');

form.all(function(req, res, next){
  res.locals.title = 'Log in';
  next();
});

form.all(limiter.prevent);

form.get(checkToken, function(req, res){
  res.render('log-in-email');
});

form.post(parse, checkEmail, checkReset, checkPassword);

form.all(errorHandler);

function onLimit (req, res, next, until) {
  res.status(429).send('Log in rate limit hit. Please wait ' + moment(until).toNow(true) + ' before retrying.');
}

// The purpose of this function is to check to see if the
// user has requested the log in page with a one-time access
// token. If so, validate it, then redirect the user to the
// appropriate page: the dashboard homepage or somewhere specified
// in the query 'then'.
function checkToken (req, res, next) {

  var token, then, redirect;

  // There is no token,  then proceed to the next middleware.
  if (!req.query || !req.query.token) return next();

  token = req.query.token;

  // I had previously introduced a bug caused by the fact
  // decodeURIComponent(undefined) === 'undefined'
  // First check that there is 'then' query before attempting to decode
  if (req.query.then) then = decodeURIComponent(req.query.then);

  // First we make sure that the access token passed is valid.
  User.checkAccessToken(token, function(err, uid){

    if (err || !uid) return next(new LogInError('BADTOKEN'));

    // Then we load the user associated with the access token.
    // Tokens are stored against UIDs in the database.
    User.getById(uid, function(err, user){

      if (err || !user) return next(new LogInError('NOUSER'));

      // Store the valid user'd ID in the session.
      authenticate(req, user);

      // If the user does not need to be redirected to another page
      // send them to the dashboard's homepage. Users will be redirected 
      // elsewhere when they attempt to visit private pages, or when they
      // request a link to reset their password.
      if (then !== '/account/set-password') return res.redirect('/');

      User.generateAccessToken(uid, function(err, token){

        if (err) return next(err);

        redirect = then + '?token=' + token;

        console.log('redirecting to', redirect)
        res.redirect(redirect);
      });
    });
  });
}

function checkEmail (req, res, next) {

  var email = req.body && req.body.email;

  if (!email) return next(new LogInError('NOEMAIL'));

  User.getByEmail(email, function(err, user){

    if (err) return next(err);

    // The supplied email address does not
    // match a user in our database.
    if (!user) return next(new LogInError('BADEMAIL'));

    req.user = user;
    res.locals.email = user.email;

    next();
  });
}

function checkReset (req, res, next) {

  var user = req.user;
  var hasPassword = user.passwordHash !== '';
  var reset = req.body && req.body.reset !== undefined;

  // Some users have not yet set up a password
  // so we might need to send them a link even
  // if they did not click the reset button
  if (!reset && hasPassword) return next();

  sendPasswordResetEmail(user.uid, function(err){

    if (err) return next(err);

    res.locals.hasPassword = hasPassword;
    res.render('log-in-reset');
  });
}



function checkPassword (req, res, next) {

  var user = req.user;
  var password = req.body && req.body.password;
  var then = (req.query && req.query.then) || '/';

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
  this.code = code || "";
}

LogInError.prototype = new Error();

module.exports = login;