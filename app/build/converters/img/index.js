var fs = require("fs");
var extname = require("path").extname;
var helper = require("helper");
var titlify = helper.titlify;
var ensure = helper.ensure;
var LocalPath = helper.localPath;

function is(path) {
  return (
    [".png", ".jpg", ".jpeg", ".gif"].indexOf(extname(path).toLowerCase()) > -1
  );
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  var localPath = LocalPath(blog.id, path);

  fs.stat(localPath, function(err, stat) {
    if (err) return callback(err);

    var title = titlify(path);
    var isRetina =
      path.toLowerCase().indexOf("@2x") > -1 ? 'data-2x="true"' : "";

    var contents =
      '<img src="' +
      path +
      '" title="' +
      title +
      '" alt="' +
      title +
      '" ' +
      isRetina +
      "/>";

    callback(null, contents, stat);
  });
}

module.exports = { is: is, read: read };
