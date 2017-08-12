var Dropbox = require('dropbox');
var config = require('config');
var get = require('./get');
var ensure = require('helper').ensure;

module.exports = function makeClient (id, callback) {

  ensure(id, 'string')
    .and(callback, 'function');

  var client = new Dropbox.Client(config.dropbox);

  get({id: id}, function(err, blog){

    if (err) return callback(err);

    client.setCredentials(blog.credentials);

    client.authenticate(callback);
  });
};
