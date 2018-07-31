var Blog = require("blog");

module.exports = function(req, res, next) {
  // The user does not have any blogs
  if (!req.user.blogs.length) return res.redirect("/");

  Blog.get({ handle: req.params.handle }, function(err, blog) {
    if (blog.owner !== req.user.uid) return res.redirect("/account");

    req.blogToClose = blog;
    res.locals.blogToClose = blog;

    return next();
  });
};
