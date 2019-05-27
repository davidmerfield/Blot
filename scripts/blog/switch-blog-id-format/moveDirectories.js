var fs = require("fs-extra");
var config = require("config");
var STATIC_DIRECTORY = config.blog_static_files_dir;
var BLOG_DIRECTORY = config.blog_folder_dir;
var debug = require("debug")("blot:scripts:set-blog-id:moveDirectories");
var async = require("async");
var colors = require("colors/safe");

module.exports = function moveDirectories(oldBlogID, newBlogID, callback) {
  console.log(colors.dim("Blog: " + oldBlogID) + " Moving blog directories");

  var tasks = [];

  var oldBlogDir = BLOG_DIRECTORY + "/" + oldBlogID;
  var oldStaticFilesDir = STATIC_DIRECTORY + "/" + oldBlogID;

  var newBlogDir = BLOG_DIRECTORY + "/" + newBlogID;
  var newStaticFilesDir = STATIC_DIRECTORY + "/" + newBlogID;

  if (fs.existsSync(oldBlogDir)) {
    debug("Moving blog folder");
    debug("  Old: ", oldBlogDir);
    debug("  New: ", newBlogDir);
    tasks.push(fs.remove.bind(null, newBlogDir));
    tasks.push(fs.move.bind(null, oldBlogDir, newBlogDir));
  }

  if (fs.existsSync(oldStaticFilesDir)) {
    debug("Moving static files folder");
    debug("  Old: ", oldStaticFilesDir);
    debug("  New: ", newStaticFilesDir);
    tasks.push(fs.remove.bind(null, newStaticFilesDir));
    tasks.push(fs.move.bind(null, oldStaticFilesDir, newStaticFilesDir));
  }

  tasks.push(fs.ensureDir.bind(null, newBlogDir));
  tasks.push(fs.ensureDir.bind(null, newStaticFilesDir));

  async.series(tasks, callback);
};
