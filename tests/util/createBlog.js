var Blog = require("../../app/models/blog");
var randomString = require("./randomString");
var localPath = require('../../app/helper').localPath;

module.exports = function(done) {
  var context = this;

  Blog.create(context.user.uid, { handle: randomString(16) }, function(
    err,
    blog
  ) {
    if (err) {
      return done(new Error(err.handle));
    }

    context.blogDirectory = localPath(blog.id, "/");

    if (context.blogDirectory.slice(-1) === "/")
      context.blogDirectory = context.blogDirectory.slice(0, -1);
          
    context.blog = blog;

    done(err);
  });
};
