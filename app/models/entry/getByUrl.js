var helper = require('helper');
var ensure = helper.ensure;
var redis = require('client');
var get = require('./get');
var urlKey = require('./key').url;

module.exports = function getByUrl (blog, entryUrl, callback) {

  ensure(blog, 'object')
    .and(entryUrl, 'string')
    .and(callback, 'function');

  redis.get(urlKey(blog.id, entryUrl), function(error, entryID){

    if (error) throw error;

    if (entryID === null || entryID === undefined)
      return callback();

    get(blog.id, entryID, callback);
  });
};
