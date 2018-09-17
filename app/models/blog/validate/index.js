var helper = require('helper');
var dirToModule = helper.dirToModule;
var type = helper.type;
var ensure = helper.ensure;
var validator = dirToModule(__dirname, require);
var MODEL = require('../scheme').TYPE;
var _ = require('lodash');

// validator models should not modifiy the state of
// the database. they recieve a piece of information
// and return an error with explanation OR the piece
// of valid data.

// Export a function which provides async access
// to all the async modules. this requires user
// each time and is bad in that respect
module.exports = function(blogID, updates, callback) {

  ensure(blogID, 'string')
    .and(updates, MODEL)
    .and(callback, 'function');

  var totalUpdates = 0,
      validUpdates = {},
      errors = {};

  for (var i in updates)
    if (type(validator[i]) === 'function') {
      totalUpdates++;
    } else {
      validUpdates[i] = updates[i];
    }

  if (!totalUpdates) {

    if (_.isEmpty(errors)) errors = null;

    return callback(errors, validUpdates);
  }

  for (var key in updates)
    if (type(validator[key]) === 'function')
      validator[key](blogID, updates[key], onValidation(key));

  function onValidation (key) {

    return function(error, validUpdate){

      if (error) errors[key] = error;

      // validUpdate might be falsy (empty string, FALSE)
      if (validUpdate !== undefined) validUpdates[key] = validUpdate;

      if (!--totalUpdates) {
        if (_.isEmpty(errors)) errors = null;
        callback(errors, validUpdates);
      }
    };
  }
};