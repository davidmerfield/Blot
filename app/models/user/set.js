var helper = require('helper');
var ensure = helper.ensure;
var validate = require('./validate');
var client = require('client');

var key = require('./key');
var getById = require('./getById');

module.exports = function save (uid, updates, callback) {

  ensure(uid, 'string')
    .and(updates, 'object')
    .and(callback, 'function');

  var multi, userString;

  getById(uid, function(err, user){

    if (err) return callback(err);

    if (!user) return callback(new Error('No user'));

    validate(user, updates, function(err, user, changes){

      if (err) return callback(err);

      try {
        userString = JSON.stringify(user);
      } catch (e) {
        return callback(e);
      }

      // If I add or remove methods here
      // also remove them from create.js
      multi = client.multi();
      multi.set(key.email(user.email), uid);
      multi.set(key.user(uid), userString);

      // some users might not have stripe subscriptions
      if (user.subscription && user.subscription.customer)
        multi.set(key.customer(user.subscription.customer), uid);

      multi.exec(function(err){

        if (err) return callback(err);

        // if (changes.length) console.log('User:', uid, 'Set', changes);

        callback(null, changes);
      });
    });
  });
};