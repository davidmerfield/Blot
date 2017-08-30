var helper = require('helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var redis = require('client');
var key = require('./key');
var Blog = require('blog');

module.exports = function (account_id, callback) {

  ensure(account_id, 'string')
    .and(callback, 'function');

  var blogs = [];

  redis.SMEMBERS(key.dropbox(account_id), function(err, members){

    if (err) return callback(err);

    forEach(members, function(id, next){

      Blog.get({id: id}, function(err, blog){

        if (err) return callback(err);

        if (!blog) return next();

        blogs.push(blog);

        next();
      });
    }, function(){
      callback(null, blogs);
    });
  });
};