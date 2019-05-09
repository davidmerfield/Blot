var Blog = require("blog");
var CDN = "blotcdn.com";
var async = require("async");
var config = require("config");
var uuid = require("uuid/v4");
var extname = require("path").extname;
var config = require("config");
var folder = "_avatars";
var request = require("request");
var fs = require("fs-extra");
var dirname = require("path").dirname;

var VALID_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];

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
          if (err || !blog) return next();

          if (blog.avatar.indexOf(CDN) === -1) return next();

          var extension = extname(blog.avatar).toLowerCase();

          if (VALID_EXTENSIONS.indexOf(extension) === -1) {
            console.log(blog.id, "Has invalid extension:", blog.avatar);
            return next();
          }

          var name = uuid() + extension;
          var path =
            config.blog_static_files_dir +
            "/" +
            blog.id +
            "/" +
            folder +
            "/" +
            name;

          var url = "/" + folder + "/" + name;

          fs.ensureDirSync(dirname(path));

          var currentURL = blog.avatar;

          if (currentURL[0] === "/" && currentURL[1] === "/") {
            currentURL = "https:" + currentURL;
          }

          var ws = fs.createWriteStream(path);

          ws.on("close", function() {
            if (!fs.existsSync(path) || !fs.statSync(path).size) {
              console.log(
                blog.id,
                "Error with file downlaoded",
                path,
                fs.statSync(path)
              );
              return next();
            }

            Blog.set(blogID, { avatar: url }, function(err) {
              if (err) return next(err);

              console.log(
                blog.id,
                "Saved avatar for http://" + blog.handle + "." + config.host
              );
              next();
            });
          });

          ws.on("error", next);

          request
            .get({ uri: currentURL, timeout: 5000 })
            .on("error", next)
            .pipe(ws);
        });
      },
      callback
    );
  });
}

module.exports = main;
