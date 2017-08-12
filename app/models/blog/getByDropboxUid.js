var helper = require('helper');
var forEach = helper.forEach;
var ensure = helper.ensure;
var client = require('../client');
var key = require('./key');
var get = require('./get');

module.exports = function (uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  var blogs = [];

  client.SMEMBERS(key.dropbox(uid), function(err, members){

    if (err) return callback(err);

    forEach(members, function(id, next){

      get({id: id}, function(err, blog){

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