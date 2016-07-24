var Blog = require('../../app/models/blog');
var User = require('../../app/models/user');
var helper = require('../../app/helper');
var ensure = helper.ensure;

module.exports = function (handle, callback) {

  ensure(handle, 'string').and(callback, 'function');

  Blog.get({handle: handle}, function(err, HAblog){

    if (err) throw err;

    Blog.get({id: handle}, function(err, IDblog){

      if (err) throw err;

      var blog = HAblog || IDblog;

      if (!blog) throw 'No blog id ' + handle;

      var uid = blog.owner;

      User.getBy({uid: uid}, function(err, user){

        if (err || !user) throw err || 'No user';

        User.makeClient(uid, function(err, client){

          if (err || !client) throw err || 'No client';

          ensure(user, 'object').and(blog, 'object').and(client, 'object');

          return callback(user, blog, client);
        });
      });
    });
  });
};