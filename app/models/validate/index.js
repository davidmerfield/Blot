// validator models should not modifiy the state of
// the database. they recieve a piece of information
// and return an error with explanation OR the piece
// of valid data.

var validator = {},
    helper = require('../../helper'),
    type = helper.type,
    forEach = helper.forEach,
    fs = require('fs'),
    ensure = helper.ensure;

// Load the other validator files in this folder
fs.readdirSync(__dirname).forEach(function(file) {

  if (file === "index.js" || file.substr(file.lastIndexOf('.') + 1) !== 'js')
    return;

  var name = file.substr(0, file.indexOf('.'));

  validator[name] = require('./' + name);
});

// Export a function which provides async access
// to all the async modules. this requires user
// each time and is bad in that respect
module.exports = function(uid, updates, callback) {

  var User = require('../../models/user');

  ensure(uid, 'string')
    .and(updates, 'object')
    .and(callback, 'function');

  var validUpdates = {},
      errors = {};

  forEach(updates, function(name, value, next){

    try {
      ensure(value, User.model[name]);
    } catch (e){
      errors[name] = 'Invalid type for update to ' + name;
      return next();
    }

    if (!type(validator[name], 'function')) {
      validUpdates[name] = value;
      return next();
    }

    validator[name](uid, value, function(error, validUpdate){

      if (error) errors[name] = error;

      // validUpdate might be falsy (empty string, FALSE)
      if (validUpdate !== undefined)
        validUpdates[name] = validUpdate;

      return next();

    });

  }, function (){
    callback(errors, validUpdates);
  });
};