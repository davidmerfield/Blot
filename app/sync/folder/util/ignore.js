var helper = require('helper');
var async = require('async');
var ensure = helper.ensure;

var addIgnore = require('ignored').add;
var dropEntry = require('entry').drop;

module.exports = function (blog, path, reason, callback){

  ensure(blog, 'object')
    .and(path, 'string')
    .and(reason, 'string')
    .and(callback, 'function');

  // Remove this file from the user's blog
  // and from the folder on the server.
  var queue = [
    addIgnore.bind(this, blog.id, path, reason),
    dropEntry.bind(this, blog, path)
  ];

  async.eachSeries(queue, function(method, next){

    method(next);

  }, callback);
};