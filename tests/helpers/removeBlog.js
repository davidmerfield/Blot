var Blog = require('../../app/models/blog');

module.exports = function(done){
  Blog.remove(global.blog.id, done);
};