const Blog = require("blog");
const moment = require("moment");

module.exports = function (req, res, next, handle) {
  if (!req.session || !req.user || !req.user.blogs.length) return next();
  if (!handle) return next();

  req.handle = handle;

  Blog.get({ handle }, function (err, blog) {
    if (!blog || blog.owner !== req.user.uid) return next(new Error("No blog"));

    try {
      blog = Blog.extend(blog);

      if (blog.status && blog.status.message === "Synced") {
        blog.status.fromNow = moment(blog.status.datestamp).fromNow();
        blog.status.state = "synced";
      }

      if (blog.status && blog.status.message !== "Synced") {
        blog.status.state = "syncing";
      }

      // todo add error here...

      blog.updated = moment(blog.cacheID).fromNow();
    } catch (e) {
      return next(e);
    }

    req.blog = blog;
    res.locals.blog = blog;

    next();
  });
};
