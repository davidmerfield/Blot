var helper = require('../../helper');
var ensure = helper.ensure;

var redis = require('../client');
var get = require('./get');

var pathKey = require('./key').path;

// DROPBOX PATHS ARE CASE INSENSITIVE
// https://www.dropbox.com/developers/core/bestpractices
module.exports = function getByPath (blogID, path, callback) {

  ensure(blogID, 'string')
    .and(path, 'string')
    .and(callback, 'function');

  redis.get(pathKey(blogID, path), function(error, entryID){

    if (error) throw error;

    if (!entryID) return callback();

    return get(blogID, parseInt(entryID), callback);
  });
};