var Blog = require("blog");

module.exports = function(req, res, next) {
  if (!req.user || !req.user.blogs.length) return next();

  Blog.get({ handle: req.params.handle }, function(err, blog) {
    if (!blog) return next();
    if (blog.owner !== req.user.uid) return next();

    try {
      blog = Blog.extend(blog);
    } catch (e) {
      return next(e);
    }
    req.blog = blog;
    res.locals.blog = blog;
    return next();
  });
};
