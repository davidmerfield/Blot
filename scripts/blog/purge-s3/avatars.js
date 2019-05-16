var Blog = require("blog");
var CDN = "blotcdn.com";
var config = require("config");
var uuid = require("uuid/v4");
var extname = require("path").extname;
var config = require("config");
var yesno = require("yesno");
var colors = require("colors/safe");
var fs = require("fs-extra");

var humanFileSize = require("./util/humanFileSize");
var download = require("./util/download");

function main(blog, next) {
    console.log("Blog:", blog.id, "Checking avatar...");

  if (blog.avatar.indexOf(CDN) === -1) return next();

  var extension = extname(blog.avatar).toLowerCase();
  var name = uuid() + extension;
  var avatar = "/_avatars/" + name;
  var path = config.blog_static_files_dir + "/" + blog.id + avatar;

  if ([".jpg", ".jpeg", ".png", ".gif"].indexOf(extension) === -1) {
    console.log(blog.id, "Has invalid extension:", blog.avatar);
    return next();
  }

  download(blog.avatar, path, function(err) {
    if (err) return next(err);

    var message =
      colors.dim("Replace avatar for ") +
      colors.yellow(blog.handle) +
      " - " +
      blog.id +
      colors.dim("\nOld: ") +
      blog.avatar +
      colors.dim("\nNew: ") +
      avatar +
      colors.dim("\n     ") +
      path +
      " - " +
      humanFileSize(fs.statSync(path).size);

    yesno.ask(message, true, function(ok) {
      if (!ok) return next();

      Blog.set(blog.id, { avatar: avatar }, next);
    });
  });
}

if (require.main === module) require("./util/cli")(main);

module.exports = main;
