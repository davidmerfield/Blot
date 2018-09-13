var Blog = require('../../app/models/blog');

module.exports = function (done) {
  Blog.create(global.test_uid, {}, function(err, blog){
    global.blog_id = blog.id;
    done(err);
  });
};
