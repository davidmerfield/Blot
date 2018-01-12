var each_user = require('./each/user');
var User = require('../app/models/user');
var IN_USE = 'This email is in use.';

each_user(function(user, next) {

  var normalized_email = user.email.trim().toLowerCase();

  if (normalized_email === user.email) return next();

  User.set(user.uid, {email: normalized_email}, function then (err){
    
    if (err && err.message === IN_USE) {
      normalized_email = 'OLD_' + normalized_email;
      return User.set(user.uid, {email: normalized_email}, then);
    }

    if (err) throw err;

    console.log('set email to', normalized_email, 'from', user.email);

    next();
  });

}, process.exit);