const Blog = require("models/blog");
const async = require("async");

module.exports = function (req, res, next) {
  if (!req.session || !req.user || !req.user.blogs.length) return next();

  var blogs = [];

  async.each(
    req.user.blogs,
    function (blogID, nextBlog) {
      Blog.get({ id: blogID }, function (err, blog) {
        if (!blog) return nextBlog();

        try {
          blog = Blog.extend(blog);
        } catch (e) {
          return next(e);
        }

        blogs.push(blog);
        nextBlog();
      });
    },
    function () {
      req.blogs = blogs;
      res.locals.blogs = blogs;
      return next();
    }
  );
};
