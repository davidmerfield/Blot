var localPath = require("helper").localPath;
var colors = require("colors/safe");
var fs = require("fs-extra");
var async = require("async");
var Blog = require("blog");

function folders(blogID, callback) {
  if (fs.existsSync(localPath(blogID, "/")))
    return callback(new Error("Blog folder for the blog still exists"));

  callback(null, "The blog's folder does not exist");
}

function IDList(blogID, callback) {
  Blog.getAllIDs(function(err, ids) {
    if (ids.indexOf(blogID) > -1)
      return callback(new Error("ID remains on the list of all blog IDs"));

    callback(null, "Blog ID was removed from the list of blog IDs");
  });
}

function blogs(blogID, callback) {
  Blog.get({ id: blogID }, function(err, blog) {
    if (blog)
      return callback(new Error("There is a blog stored against the ID"));

    callback(null, "The blog cannot be retrieved from the DB");
  });
}

function main(blogID, callback) {
  var prefix = colors.dim("Blog: " + blogID);
  var checks = [folders, IDList, blogs].map(function(fn) {
    return function(next) {
      fn(blogID, function(err, message) {
        if (err) {
          console.log(prefix, colors.red("[x] " + err.message));
        } else {
          console.log(prefix, "[•] " + message);
        }
        next();
      });
    };
  });

  async.series(checks, callback);
}

module.exports = main;
