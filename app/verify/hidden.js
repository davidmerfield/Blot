var helper = require('../helper');
var ensure = helper.ensure;
var handle = require('../sync/dropbox/handle');
var Compare = require('./compare');
var Blog = require('../models/blog');
var joinPath = require('path').join;

module.exports = function(blogID, callback){

  ensure(blogID, 'string')
    .and(callback, 'function');

  var compare = Compare(blogID);

  compare('/', function(err, changes){

    if (err) return callback(err);

    if (!changes.length) return callback();

    Blog.get({id: blogID}, function(err, blog){

      // Ensure any changes are nested by blog folder...
      changes.forEach(function(change){
        change.path = joinPath(blog.folder, change.path);
        change.stat.path = change.path;
      });

      handle(blog.owner, changes, callback);
    });
  });
};