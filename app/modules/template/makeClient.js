var Blog = require('../../models/blog');
var User = require('../../models/user');

module.exports = function(blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    if (err || !blog) return callback(err || 'No blog');

    User.makeClient(blog.owner, function(err, client){

      if (err || !client) return callback(err || 'No client');

      return callback(null, client, blog.folder);
    });
  });
};