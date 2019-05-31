var fs = require("fs-extra");
var config = require("config");
var Blog = require("blog");
var async = require("async");

if (require.main === module) {
  main(function(err) {
    if (err) throw err;
    console.log("\nDone!");
    process.exit();
  });
}

function main(callback) {
  fs.readdir(config.cache_directory, function(err, items) {
    if (err) return callback(err);
    console.log("Wiping " + items.length + " in cache directory");
    async.eachSeries(
      items,
      function(item, next) {
        // Ignore dotfiles and .tmp directory
        if (item[0] === ".") return next();

        process.stdout.write("\r-" + config.cache_directory + "/" + item);
        fs.remove(config.cache_directory + "/" + item, next);
      },
      function(err) {
        if (err) return callback(err);
        Blog.getAllIDs(function(err, blogIDs) {
          console.log("\nUpdating cache ID of " + blogIDs.length + " blogs");
          async.eachSeries(
            blogIDs,
            function(blogID, next) {
              process.stdout.write("\r-" + blogID);
              Blog.set(blogID, { cacheID: Date.now() }, next);
            },
            callback
          );
        });
      }
    );
  });
}

module.exports = main;
