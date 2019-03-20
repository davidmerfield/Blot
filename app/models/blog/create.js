var helper = require('helper');
var ensure = helper.ensure;
var extend = helper.extend;
var capitalise = helper.capitalise;
var defaults = require('./defaults');
var client = require('client');
var key = require('./key');
var set = require('./set');
var fs = require("fs-extra");
var localPath = helper.localPath;
var User = require('../user');
var validate = require('./validate');
var uuid = require('uuid/v4');

module.exports = function create (uid, info, callback) {

  ensure(uid, 'string')
    .and(info, 'object')
    .and(callback, 'function');

  var blogs;
  var blog = {
    owner: uid,
    title: info.title || capitalise((info.handle || 'untitled') + '\’s') + ' blog',
    client: '',
    timeZone: info.timeZone || 'UTC',
    dateFormat: info.dateFormat || 'M/D/YYYY'
  };

  extend(blog)
    .and(info)
    .and(defaults);

  validate('', blog, function(errors){

    if (errors) return callback(errors);

    User.getById(uid, function(err, user){

      if (err || !user) return callback(err || new Error('No user'));      

      if (err) return callback(err);

      // Cast to a string from int
      blogID = 'blog_' + uuid().split('-').join('');
      blog.id = blogID;
      
      blogs = user.blogs || [];
      blogs.push(blogID);

      User.set(uid, {blogs: blogs, lastSession: blogID}, function(err){

        if (err) return callback(err);

        set(blogID, blog, function(err){

          if (err) return callback(err);

          fs.emptyDir(localPath(blog.id, "/"), function(err) {
            
            if (err) return callback(err);

            return callback(err, blog);
          });
        });
      });
    });
  });
};