var drafts = require("../drafts");
var previewPath = drafts.previewPath;
var Blog = require("blog");

module.exports = function(blogID, path, callback) {
  callback = callback || function() {};

  var clients = require("clients");

  Blog.get({ id: blogID }, function(err, blog) {
    if (err) return callback(err);

    if (!blog.client) return callback();

    var preview_path = previewPath(path);
    var client = clients[blog.client];

    client.remove(blogID, preview_path, callback);
  });
};
