var Blog = require("blog");
var fs = require("fs-extra");
var localPath = require("helper").localPath;
var colors = require("colors/safe");
var async = require("async");

function folders(oldBlogID, newBlogID, callback) {
  if (fs.existsSync(localPath(oldBlogID, "/")))
    return callback(new Error("Blog folder for the old ID still exists"));

  if (
    !fs.existsSync(localPath(newBlogID, "/")) ||
    !fs.statSync(localPath(newBlogID, "/")).isDirectory()
  )
    return callback(new Error("Blog folder for the new ID does not exist"));

  callback(null, "The folders are in order");
}

function IDList(oldBlogID, newBlogID, callback) {
  Blog.getAllIDs(function(err, ids) {
    if (ids.indexOf(oldBlogID) !== -1)
      return callback(
        new Error("New blog ID is not on the list of all blog IDs")
      );

    if (ids.indexOf(newBlogID) === -1)
      return callback(new Error("Old blog ID is on the list of all blog IDs"));

    callback(null, "The list of blog IDs is in order");
  });
}

function blogs(oldBlogID, newBlogID, callback) {
  Blog.get({ id: newBlogID }, function(err, blog) {
    if (!blog || blog.id !== newBlogID)
      return callback(new Error("There is not blog stored against the new ID"));

    Blog.get({ id: oldBlogID }, function(err, blog) {
      if (blog)
        return callback(new Error("There is a blog stored against the old ID"));

      callback(
        null,
        "The new blog can be retrieved from the DB and the old cannot"
      );
    });
  });
}

function main(oldBlogID, newBlogID, callback) {
  var prefix = colors.dim("Blog: " + oldBlogID);
  var checks = [folders, IDList, blogs].map(function(fn) {
    return function(next) {
      fn(oldBlogID, newBlogID, function(err, message) {
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

if (require.main === module) {
  require("./loadID")(process.argv[2], function(err, newID) {
    main(process.argv[2], newID, function(err) {
      if (err) throw err;
      console.log("Done!");
      process.exit();
    });
  });
}
