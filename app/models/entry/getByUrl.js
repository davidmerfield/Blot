var helper = require('../../helper');
var ensure = helper.ensure;
var redis = require('../client');
var get = require('./get');
var urlKey = require('./key').url;

module.exports = function getByUrl (blogID, entryUrl, callback) {

  ensure(blogID, 'string')
    .and(entryUrl, 'string')
    .and(callback, 'function');

  // stripe trailing url and
  // ensure leading slash
  // so it's consistent with set
  entryUrl = decodeURIComponent(entryUrl);
  entryUrl = entryUrl.toLowerCase();

  redis.get(urlKey(blogID, entryUrl), function(error, entryID){

    if (error) throw error;

    if (entryID === null || entryID === undefined)
      return callback();

    get(blogID, entryID, callback);
  });
};
