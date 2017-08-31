var Dropbox = require('dropbox');
var get = require('./get');
var ensure = require('helper').ensure;

module.exports = function makeClient (id, callback) {

  ensure(id, 'string')
    .and(callback, 'function');

  get({id: id}, function(err, blog){

    if (err) return callback(err);

    var accessToken = blog.dropbox.token;
    var client = new Dropbox({accessToken: accessToken});

    return callback(null, client);
  });
};
