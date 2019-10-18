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

    drafts.previewFile(blog.handle, path, function(err, contents) {
      if (err) return callback(err);

      var client = clients[blog.client];

      client.write(blogID, preview_path, contents, callback);
    });
  });
};
