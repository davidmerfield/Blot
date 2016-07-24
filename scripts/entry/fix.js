var helper = require('../../app/helper');
var ensure = helper.ensure;
var type = helper.type;

var isHidden = require('../../app/models/entry/build/prepare/isHidden');

module.exports = function(blog, entry, callback) {

  var changes = [];

  ensure(blog, 'object')
    .and(entry, 'object')
    .and(callback, 'function');

  return callback(entry, changes);
};