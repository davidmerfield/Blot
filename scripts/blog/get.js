var Blog = require("../../app/models/blog");
var User = require("../../app/models/user");
var helper = require("../../app/helper");
var ensure = helper.ensure;
var async = require('async');
module.exports = function(handle, callback) {
  ensure(handle, "string").and(callback, "function");

  Blog.get({ handle: handle }, function(err, HAblog) {
    if (err) throw err;

    Blog.get({ id: handle }, function(err, IDblog) {
      if (err) throw err;

      var blog = HAblog || IDblog;

      if (!blog) throw "No blog id " + handle;

      var uid = blog.owner;
      var blogs = [];

      User.getById(uid, function(err, user) {
        if (err || !user) throw err || "No user";

        async.each(
          user.blogs,
          function(blogID, next) {
            Blog.get({id: blogID}, function(err, blog){
              if (err) return next(err);
              if (!blog) return next(new Error('No blog ' + blogID + ' but user has it on their list'));
              blogs.push(blog);
              next();
            });
          },
          function(err) {

            if (err) throw err;

            ensure(user, "object").and(blog, "object");

            return callback(user, blog, blogs);
          }
        );
      });
    });
  });
};
