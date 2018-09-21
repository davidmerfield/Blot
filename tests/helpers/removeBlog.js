var Blog = require('../../app/models/blog');

module.exports = function(done){
  var id = global.blog.id;
  delete global.blog;
  Blog.remove(id, done);
};