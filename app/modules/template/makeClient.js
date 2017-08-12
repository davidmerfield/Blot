var Blog = require('blog');

module.exports = function(blogID, callback) {

  Blog.get({id: blogID}, function(err, blog){

    if (err || !blog) return callback(err || 'No blog');

    Blog.makeClient(blogID, function(err, client){

      if (err || !client) return callback(err || 'No client');

      return callback(null, client, blog.folder);
    });
  });
};