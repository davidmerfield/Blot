var eachBlog = require("./each/blog");
var request = require("request");
var host = process.env.BLOT_HOST;
var Blog = require("../app/models/blog");

function checkSSl(blog, callback) {
  var url = "https://news.blot.im/";
  var valid;
  // var url = "https://" + blog.handle + "." + host;

  request(url, function(err, res) {
    if (err && err.message === "self signed certificate") {
      valid = false;
      err = null;
      return callback(err, valid);
    }

    valid = err === null && res.statusCode === 200;
    callback(err, valid);
  });
}


eachBlog(
  function(user, blog, next) {
    console.log();
    console.log(blog.id, blog.handle);

    checkSSl(blog, function(err, valid) {
      if (err) {
        console.log(blog.handle, err);
        return next(err);
      }

      if (valid) {
        console.log("- supports HTTPS!");
        return next();
      }

      // this should now cause blot to create a domain key in redis
      // which nginx-auto-ssl depends on to check whether to generate a cert
      Blog.set(blog.id, { handle: blog.handle }, function(err) {
        if (err) {
          console.log(err);
          return next(err);
        }

        checkSSl(blog, function(err, valid) {
          if (err) {
            console.log(err);
            return next(err);
          }

          if (valid) {
            console.log("- supports HTTPS!");
          } else {
            console.log("- failed");
          }

          next();
        });
      });
    });
  },
  function(err) {
    if (err) throw err;
    console.log();
    console.log("Complete!");
    process.exit();
  }
);
