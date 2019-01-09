var User = require("../../app/models/user");
var Blog = require("../../app/models/blog");
var parseUrl = require("url").parse;

// Takes a URL and fetches the blog, user and entry

module.exports = function get(url, callback) {
  url = parseUrl(url);

  // Map 'preview.default.foo.blot.im' -> 'foo.blot.im'
  if (url.host.indexOf("preview.") === 0)
    url.host = url.host
      .split(".")
      .slice(-3)
      .join(".");

  Blog.get({ domain: url.host }, function(err, blog) {
    if (err || !blog) return callback(err || new Error("No blog"));

    User.getById(blog.owner, function(err, user) {
      if (err || !user) return callback(err || new Error("No user"));

      callback(err, user, blog);
    });
  });
};
