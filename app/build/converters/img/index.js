var fs = require("fs");
var extname = require("path").extname;
var titlify = require("build/prepare/titlify");
var ensure = require("helper/ensure");
var LocalPath = require("helper/localPath");
var dirname = require("path").dirname;
var join = require("path").join;

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

  fs.stat(localPath, function (err, stat) {
    if (err) return callback(err);

    let pathForTitle = path;

    // We want to preserve the correct case in the
    // caption where possible.
    if (options && options.pathDisplay) {
      pathForTitle = options.pathDisplay;
    } else if (options && options.name) {
      pathForTitle = join(dirname(path), options.name);
    }

    var title = titlify(pathForTitle);
    var isRetina =
      path.toLowerCase().indexOf("@2x") > -1 ? 'data-2x="true"' : "";

    var contents =
      '<img src="' +
      encodeURI(path) +
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

module.exports = { is: is, read: read, id: "img" };
