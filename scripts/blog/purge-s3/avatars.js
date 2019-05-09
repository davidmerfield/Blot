var Blog = require("blog");
var CDN = "blotcdn.com";
var async = require("async");
var config = require("config");
var uuid = require("uuid/v4");
var extname = require("path").extname;
var config = require("config");
var download = require("./download");
var yesno = require("yesno");
var VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];
var colors = require("colors/safe");
var fs = require('fs-extra');

if (require.main === module)
  main(function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });

function main(callback) {
  Blog.getAllIDs(function(err, blogIDs) {
    async.eachSeries(
      blogIDs,
      function(blogID, next) {
        Blog.get({ id: blogID }, function(err, blog) {
          if (err || !blog || blog.avatar.indexOf(CDN) === -1) return next();

          var extension = extname(blog.avatar).toLowerCase();
          var name = uuid() + extension;
          var avatar = "/_avatars/" + name;
          var path = config.blog_static_files_dir + "/" + blog.id + avatar;

          if (VALID_EXTENSIONS.indexOf(extension) === -1) {
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

              Blog.set(blogID, { avatar: avatar }, next);
            });
          });
        });
      },
      callback
    );
  });
}

function humanFileSize(size) {
  var i = Math.floor(Math.log(size) / Math.log(1024));
  return (
    (size / Math.pow(1024, i)).toFixed(2) * 1 +
    " " +
    ["B", "kB", "MB", "GB", "TB"][i]
  );
}

module.exports = main;
