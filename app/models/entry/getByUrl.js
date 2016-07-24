var helper = require('../../helper');
var ensure = helper.ensure;

var redis = require('../client');
var getFullEntry = require('./getFullEntry');
var normalize = helper.urlNormalizer;

var urlKey = require('./key').url;

module.exports = function getByUrl (blogID, entryUrl, callback, scheduled) {

  ensure(blogID, 'string')
    .and(entryUrl, 'string')
    .and(callback, 'function');

  // stripe trailing url and
  // ensure leading slash
  // so it's consistent with set
  entryUrl = normalize(entryUrl);

  redis.get(urlKey(blogID, entryUrl), function(error, entryID){

    if (error) throw error;

    if (entryID)
      return getFullEntry(blogID, parseInt(entryID), callback, scheduled);

    if (entryUrl.indexOf('/') > -1) {
      entryUrl = entryUrl.split('/')[1];
    }

    // Try and see if there's an ID in the URL
    entryUrl = parseInt(entryUrl);

    if (isNaN(entryUrl)) return callback();

    return getFullEntry(blogID, entryUrl, callback, scheduled);
  });
};