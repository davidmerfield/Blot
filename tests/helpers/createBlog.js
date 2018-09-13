var Blog = require('../../app/models/blog');

module.exports = function (done) {
  Blog.create(global.user.uid, {}, function(err, blog){
    global.blog = blog;
    done(err);
  });
};
