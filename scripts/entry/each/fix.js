var helper = require('helper');
var ensure = helper.ensure;
var type = helper.type;

var isHidden = require('models/entry/build/prepare/isHidden');

module.exports = function(blog, entry, callback) {

  var changes = [];

  ensure(blog, 'object')
    .and(entry, 'object')
    .and(callback, 'function');

  return callback(entry, changes);
};