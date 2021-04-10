var config = require("../config");

if (config.environment !== "development")
  throw "Sorry, this script must be run locally";

var handle = process.argv[2];
var filePath = process.argv[3],
  p = require("path"),
  downloadsDir = p.resolve(__dirname + "/../tmp/downloads"),
  User = require("models/user"),
  Blog = require("models/blog");

var fs = require("fs");

if (!handle) throw "pass a handle";
if (!filePath) throw "pass a filePath";

if (handle) {
  Blog.get({ handle: handle }, function (err, blog) {
    User.makeClient(blog.owner, function (err, client) {
      client.remove(filePath, function (err, stat) {
        if (err) console.log(err);
        if (!err) console.log("removed " + filePath);
      });
    });
  });
}
