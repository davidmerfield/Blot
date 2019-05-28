var fs = require("fs-extra");
var uuid = require("uuid/v4");
var extname = require("path").extname;
var config = require("config");
var folder = "_avatars";

var VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];
var INVALID_EXTENSION =
  "Please choose an image of these formats: " + VALID_EXTENSIONS.join(", ");

module.exports = function(req, res, next) {
  if (!req.files || !req.files.avatar) return next();

  if (!req.files.avatar.size) {
    return next();
  }

  var extension = extname(req.files.avatar.path).toLowerCase();

  if (VALID_EXTENSIONS.indexOf(extension) === -1) {
    return next(new Error(INVALID_EXTENSION));
  }

  var name = uuid() + extension;
  var finalPath =
    config.blog_static_files_dir +
    "/" +
    req.blog.id +
    "/" +
    folder +
    "/" +
    name;
  var url = "/" + folder + "/" + name;

  if (req.blog.id.indexOf("blog_") === 0) {
    url = config.cdn.origin + "/" + req.blog.id + url;
  }
  
  fs.move(req.files.avatar.path, finalPath, function(err) {
    if (err) return next(err);

    req.updates.avatar = url;
    next();
  });
};
