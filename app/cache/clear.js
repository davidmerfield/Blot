var client = require('redis').createClient();
var helper = require('../helper');
var ensure = helper.ensure;
var logger = helper.logger;
var key = require('./keys');
var EVERYTHING = key.all();

module.exports = function clear (blogID, callback) {

  callback = callback || function(){};

  var setKey;

  ensure(blogID, 'string')
    .and(callback, 'function');

  if (blogID === '*') {
    setKey = EVERYTHING;
  } else {
    setKey = key.blog(blogID);
  }

  logger.debug(blogID, 'Clearing cache');

  // Retrieve all the keys for the blog or site
  // The keys represent the content and content-type
  // for a URL which Blot has cached.
  client.smembers(setKey, function(err, keys){

    if (err) throw err;

    if (!keys || !keys.length) return callback();

    keys.push(setKey);

    client.del(keys, function(err){

      if (err) throw err;

      callback();
    });
  });
};