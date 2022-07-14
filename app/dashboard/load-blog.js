var Blog = require("blog");

module.exports = function (req, res, next, handle) {
  if (!req.session || !req.user || !req.user.blogs.length) return next();
  if (!handle) return next();

  Blog.get({ handle }, function (err, blog) {
    if (!blog || blog.owner !== req.user.uid) return next(new Error("No blog"));
    try {
      blog = Blog.extend(blog);
    } catch (e) {
      return next(e);
    }

    console.log("here loaded", blog);
    req.blog = blog;
    res.locals.blog = blog;

    next();
  });
};
