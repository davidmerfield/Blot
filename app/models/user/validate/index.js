var helper = require('helper');
var ensure = helper.ensure;
var forEach = helper.forEach;
var MODEL = require('../model');

var validators = {
  email: require('./email'),
};

module.exports = function validate (user, updates, callback) {

  ensure(user, MODEL)
    .and(updates, 'object')
    .and(callback, 'function');

  var changes = [];

  try {
    ensure(updates, MODEL);
  } catch (err) {
    return callback(err);
  }

  forEach(updates, function(name, value, next){

    try {
      ensure(value, MODEL[name]);
    } catch (e){
      return callback(e);
    }

    if (!validators[name]) {
      user[name] = value;
      changes.push(name);
      return next();
    }

    validators[name](user, value, function(err, value){

      if (err) return callback(err);

      if (value) {
        user[name] = value;
        changes.push(name);
      }

      next();
    });
  }, function (){

    // Check user properties are correct type
    try {
      ensure(user, MODEL, true);
    } catch (err) {
      return callback(err);
    }

    return callback(null, user, changes);
  });
};