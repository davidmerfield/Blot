var client = require('../client');
var key = require('./key');
var _ = require('lodash');
var helper = require('../../helper');
var ensure = helper.ensure;
var logger = helper.logger;
var TYPE = require('./scheme').TYPE;
var validate = require('./validate');
var get = require('./get');
var serial = require('./serial');
var flushCache = require('./flushCache');

function Changes (latest, former) {

  var changes = {};

  // Determine any changes to the user's info
  for (var i in latest)
    if (!_.isEqual(latest[i], former[i]))
      changes[i] = latest[i] = latest[i];

  return changes;
}

module.exports = function (blogID, blog, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  validate(blogID, blog, function(errors, latest){

    if (_.isEmpty(errors)) errors = null;

    if (errors) return callback(errors);
    
    get({id: blogID}, function(err, former){

      former = former || {};

      if (err) return callback(err);

      var changes = Changes(latest, former);

      if (changes.handle) {
        client.set(key.handle(latest.handle), blogID);
      }

      if (changes.domain) {
        client.set(key.domain(latest.domain), blogID);
        client.del(key.domain(former.domain));
      }

      // Check if we need to change user's css or js cache id
      if (changes.template || changes.plugins) {
        latest.cacheID = Date.now();
        latest.cssURL = '/style.css?' + latest.cacheID;
        latest.scriptURL = '/script.js?' + latest.cacheID;
        changes.cacheID = true;
        changes.cssURL = true;
        changes.scriptURL = true;
      }

      // Verify that all the new info matches
      // strictly the type specification
      ensure(latest, TYPE);

      var changesList = _.keys(changes);

      if (!changesList.length) return callback(errors, changesList);

      client.hmset(key.info(blogID), serial(latest), function(err){

        if (err) return callback(err);

        // Invalidate the cache for the user's blog
        if (changesList.length) {
          logger(null, 'Blog: ' + blogID + ': Set', changes);
        }

        flushCache(blogID, function(err){

          if (err) return callback(err);

          callback(errors, changesList);
        });
      });
    });
  });
};