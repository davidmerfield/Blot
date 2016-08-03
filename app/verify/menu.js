var helper = require('../helper');
var ensure = helper.ensure;

module.exports = function (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  return callback();
};