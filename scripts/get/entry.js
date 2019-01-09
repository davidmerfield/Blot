var User = require("../../app/models/user");
var Entry = require("../../app/models/entry");
var Blog = require("../../app/models/blog");
var parseUrl = require("url").parse;

// Takes a URL and fetches the blog, user and entry

module.exports = function get(url, callback) {
  url = parseUrl(url);

  Blog.get({ domain: url.host }, function(err, blog) {
    if (err || !blog) return callback(err || new Error("No blog"));

    User.getById(blog.owner, function(err, user) {
      if (err || !user) return callback(err || new Error("No user"));

      Entry.getByUrl(blog.id, url.path, function(entry) {
        if (!entry) return callback(new Error("No entry"));

        callback(err, user, blog, entry);
      });
    });
  });
};
