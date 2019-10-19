var fs = require("fs-extra");
var config = require("config");
var STATIC_DIRECTORY = config.blog_static_files_dir;
var BLOG_DIRECTORY = config.blog_folder_dir;
var debug = require("debug")("blot:scripts:delete-disabled-blog:moveDirectories");
var async = require("async");
var colors = require("colors/safe");

module.exports = function removeDirectories(blogID, callback) {
  console.log(colors.dim("Blog: " + blogID) + " Moving blog directories");

  var tasks = [];

  var blogDir = BLOG_DIRECTORY + "/" + blogID;
  var staticFilesDir = STATIC_DIRECTORY + "/" + blogID;

  if (fs.existsSync(blogDir)) {
    debug("Removing blog folder", blogDir);
    tasks.push(fs.remove.bind(null, blogDir));
  }

  if (fs.existsSync(staticFilesDir)) {
    debug("Removing static files folder", staticFilesDir);
    tasks.push(fs.remove.bind(null, staticFilesDir));
  }

  async.series(tasks, callback);
};
