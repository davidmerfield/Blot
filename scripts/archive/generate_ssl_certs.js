var eachBlog = require("./each/blog");
var request = require("request");
var host = process.env.BLOT_HOST;
var redis = require("../app/models/client");

if (!host) throw new Error("No host");

function checkSSl(blog, callback) {
  var valid;
  var url = "https://" + blog.handle + "." + host;

  console.log(url);

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

var failures = [];

eachBlog(
  function(user, blog, next) {
    if (blog.isDisabled) return next();

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
      redis.set("domain:" + blog.handle + "." + host, blog.id, function(err) {
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
            failures.push(blog.handle);
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
    if (failures.length) {
      console.log("Failed:", failures);
    }
    process.exit();
  }
);
