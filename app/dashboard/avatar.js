var config = require("config");

module.exports = function (req, res, next) {
  var blogID;

  if (req.query.handle) {
    blogID = req.blogs
      .filter(function (blog) {
        return blog.handle === req.query.handle;
      })
      .map(function (blog) {
        return blog.id;
      });
  } else {
    blogID = req.blog.id;
  }

  res.sendFile(
    config.blog_static_files_dir +
      "/" +
      blogID +
      "/_avatars/" +
      req.params.avatar,
    function (err) {
      if (err) return next();
      // sent successfully
    }
  );
};
