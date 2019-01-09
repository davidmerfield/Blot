var Entry = require("../../app/models/entry");
var blog = require("./blog");
var parseUrl = require("url").parse;

// Takes a URL and fetches the blog, user and entry

module.exports = function get(url, callback) {
  blog(url, function(err, user, blog) {
    if (err) return callback(err);

    url = parseUrl(url);

    Entry.getByUrl(blog.id, url.path, function(entry) {
      if (!entry) return callback(new Error("No entry"));

      callback(err, user, blog, entry);
    });
  });
};
