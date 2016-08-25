var helper = require('../../helper');
var ensure = helper.ensure;
var Augment = require('./augment');
var eachEntry = require('./eachEntry');

// then we check each entry in the view

// we determine a new list of partials
// and locals to retrieve based on those entries

// and retrieve them
// merging them into the view

// then returning req and res

module.exports = function(req, res, callback) {

  ensure(req, 'object')
    .and(res, 'object')
    .and(callback, 'function');

  var locals = res.locals;

  var augment = Augment(req, res);

  eachEntry(locals, augment);

  return callback(null, req, res);
};