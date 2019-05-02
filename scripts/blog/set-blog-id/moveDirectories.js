var fs = require("fs-extra");
var localPath = require("helper").localPath;
var staticDirectory = require("config").blog_static_files_dir;
var debug = require("debug")("blot:scripts:set-blog-id:moveDirectories");

module.exports = function moveDirectories(oldBlogID, newBlogID, callback) {
  // This will be dangerous if oldBlog or newBlogID are empty strings
  if (!oldBlogID || !newBlogID)
    return callback(new Error("Pass valid blogs IDs to moveDirectories"));

  var oldBlogDir = localPath(oldBlogID, "/").slice(0, -1);
  var newBlogDir = localPath(newBlogID, "/").slice(0, -1);

  var oldStaticFilesDir = staticDirectory + "/" + oldBlogID;
  var newStaticFilesDir = staticDirectory + "/" + newBlogID;

  fs.ensureDirSync(oldBlogDir);
  fs.ensureDirSync(oldStaticFilesDir);

  if (fs.existsSync(newBlogDir)) {
    console.error(
      "The blog directory for new blog already exists, please remove it:\nrm -rf",
      newBlogDir
    );
    return callback(new Error("EEXISTS"));
  }

  if (fs.existsSync(newStaticFilesDir)) {
    console.error(
      "The static file directory for the new blog already exists, please remove it:\nrm -rf",
      newStaticFilesDir
    );
    return callback(new Error("EEXISTS"));
  }

  debug("Moving blog folder");
  debug("  Old: ", oldBlogDir);
  debug("  New: ", newBlogDir);

  fs.move(oldBlogDir, newBlogDir, function(err) {
    if (err) return callback(err);

    debug("Moving static files folder");
    debug("  Old: ", oldStaticFilesDir);
    debug("  New: ", newStaticFilesDir);

    fs.move(oldStaticFilesDir, newStaticFilesDir, callback);
  });
};
