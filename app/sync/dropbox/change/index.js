var helper = require('../../../helper');
var ensure = helper.ensure;

var Remove = require('./remove');
var Update = require('./update');

module.exports = function handle (blog, client, change, callback) {

  ensure(blog, 'object')
    .and(client, 'object')
    .and(change, 'object')
    .and(callback, 'function');

  if (change.wasRemoved) {

    Remove(blog, change, client, callback);

  } else {

    Update(blog, change, client, callback);

  }
};