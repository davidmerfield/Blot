var Metadata = require("models/metadata");
var join = require("path").join;
var basename = require("path").basename;
var blog_folder_dir = require("config").blog_folder_dir;
var fs = require("fs-extra");
var dirname = require("path").dirname;

module.exports = function (req, callback) {
  var path = join(blog_folder_dir, req.blog.id, "public");

  fs.readdir(path, function (err, contents) {
    // The user doesn't have a public folder
    if (err && err.code === "ENOENT") return callback(null, []);

    contents = contents.map(function (name) {
      return join(path, name);
    });

    Metadata.get(req.blog.id, contents, function (err, names) {
      // The user doesn't have a public folder
      if (err) return callback(null, []);

      contents = contents.map(function (path, i) {
        name = names[i] || basename(path);
        return { path: join(dirname(path), name), name: name };
      });

      return callback(err, contents);
    });
  });
};
