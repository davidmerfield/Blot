var helper = require('../../helper');
var ensure = helper.ensure;
var key = require('./_key');
var client = require('../client');

// Returns a callback with
// err, url, contents
module.exports = function (blogID, callback) {

  ensure(blogID, 'string')
    .and(callback, 'function');

  client.SMEMBERS(key.everything(blogID), function (err, everything) {

    if (err)
      throw err;

    if (!everything.length)
      return callback(null, []);

    client.MGET(everything, function(err, response){

      if (err)
        throw err;

      if (!response.length)
        return callback(null, []);

      // Filter out falsy values
      response = response.filter(function(c){
        return c;
      });

      return callback(null, response);
    });
  });

};