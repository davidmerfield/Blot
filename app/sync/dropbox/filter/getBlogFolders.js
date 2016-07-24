var User = require('../../../models/user');
var Blog = require('../../../models/blog');

var helper = require('../../../helper');
var ensure = helper.ensure;
var forEach = helper.forEach;

module.exports = function(uid, callback) {

  ensure(uid, 'string')
    .and(callback, 'function');

  var folders = {};

  // Will eventually be:
  // PATH : BLOGID e.g. {
  // "/robert": "1",
  // "/david": "2",
  // "/jesus": "3"
  // }

  User.getBy({uid: uid}, function(err, user){

    if (err || !user)
      return callback(err || new Error('No user with uid ' + uid));

    forEach(user.blogs, function(blogID, nextBlog){

      Blog.get({id: blogID}, function(err, blog){

        if (err || !blog)
          return nextBlog(err || new Error('No blog with id ' + blogID));

        // a possible bug involves two missing folders
        // (both get collapsed...) to same ID.
        folders[blog.folder || ''] = blogID;

        nextBlog();
      });
    }, function(err){

      callback(err, folders);
    });
  });
};


