var User = require("../../app/models/user");
var Blog = require("../../app/models/blog");
var parseUrl = require("url").parse;

// Takes a URL or handle and fetches the blog and user
module.exports = function get(identifier, callback) {
  var domain;
  var handle;
  var blog;

  handle = identifier;

  try {
    // Map 'preview.default.foo.blot.im' -> 'foo.blot.im'
    if (parseUrl(identifier).host.indexOf("preview.") === 0)
      domain = parseUrl(identifier)
        .host.split(".")
        .slice(-3)
        .join(".");
    else domain = parseUrl(identifier).host;
  } catch (e) {
    domain = identifier;
  }

  Blog.get({ domain: domain }, function(err, blogFromDomain) {
    Blog.get({ handle: handle }, function(err, blogFromHandle) {
      if (!blogFromDomain && !blogFromHandle)
        return callback(new Error("No blog"));

      blog = blogFromHandle || blogFromDomain;

      User.getById(blog.owner, function(err, user) {
        if (err || !user) return callback(err || new Error("No user"));

        callback(err, user, blog);
      });
    });
  });
};
