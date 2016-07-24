var helper = require('../helper');
var ensure = helper.ensure;
var normalize = require('./normalize');
var client = require('redis').createClient();
var key = require('./keys');

module.exports = function get (fullUrl, callback) {

  ensure(fullUrl, 'string')
    .and(callback, 'function');

  fullUrl = normalize(fullUrl);

  if (!fullUrl) return callback();

  client.mget([key.content(fullUrl), key.type(fullUrl)], function(err, res){

    callback(err, res[0], res[1]);
  });
};