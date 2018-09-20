var helper = require("helper");
var fs = require("fs-extra");
var Git = require("simple-git/promise");
var debug = require("debug")("client:git:dashboard");
var UID = helper.makeUid;
var join = require("path").join;
var config = require("config");
var repos = require('./repos');
var database = require('./database');

function blog_dir(blog_id) {
  return join(config.blog_folder_dir, blog_id);
}


// What should create do?
// - should return an error if there is already a git repo in the user's folder
// - should preserve the existing contents of the user's folder
// - should create a bare repository to serve as the source of truth
// - should pull the bare repository into the user's folder
// - should generate an 
module.exports = function create(blog, callback) {

  var blog_folder = blog_dir(blog.id);
  var tmp_folder = helper.tempDir() + "/git-" + helper.guid() + blog.id;
  var bare_repo_path = __dirname + "/data/" + blog.handle + ".git";
  var bare_git_repo;
  var git_repo_in_blog_folder;
  var placeholder_path = join(blog_folder, "placeholder-" + UID(16) + ".txt");

  fs.stat(blog_folder + "/.git", function(err, stat) {
    
    if (stat && !err) {
      return callback(
        new Error(
          "There is already a git repository in your blogs folder, please remove it"
        )
      );
    }

    if (err && err.code !== "ENOENT") {
      return callback(err);
    }

    database.refresh_token(blog.id, function(err) {
      if (err) return callback(err);

      repos.create(blog.handle, function(err) {
        if (err) return callback(err);

        bare_git_repo = Git(__dirname + "/data/" + blog.handle + ".git");
        // start_listener(req.blog.handle);

        fs.copy(blog_folder, tmp_folder)
          .then(function() {
            debug(blog.id, "Emptying blog folder");
            return fs.emptyDir(blog_folder);
          })
          .then(function() {
            debug(blog.id, "Cloning bare repository");
            return bare_git_repo.clone(bare_repo_path, blog_folder);
          })
          .then(function() {
            debug(blog.id, "Copying tmp folder");
            return fs.copy(tmp_folder, blog_folder);
          })
          .then(function() {
            git_repo_in_blog_folder = Git(blog_folder);
            debug(blog.id, "Removing tmp folder");
            return fs.remove(tmp_folder);
          })
          .then(function() {
            debug(blog.id, "Writing placeholder");
            return fs.outputFile(placeholder_path, "", "utf-8");
          })
          .then(function() {
            debug(blog.id, "Adding placeholder to checked out repo");
            return git_repo_in_blog_folder.add("./*");
          })
          .then(function() {
            debug(blog.id, "Commiting placeholder in checked out repo");
            return git_repo_in_blog_folder.commit(["-m", "Initial commit"]);
          })
          .then(function() {
            debug(blog.id, "Removing placeholder");
            return fs.remove(placeholder_path);
          })
          .then(function() {
            debug(blog.id, "Adding removed placeholder to index");
            return git_repo_in_blog_folder.add("./*");
          })
          .then(function() {
            debug(blog.id, "Commiting removed placeholder");
            return git_repo_in_blog_folder.commit([
              "-m",
              "Removed placeholder file"
            ]);
          })
          .then(function() {
            debug(blog.id, "Pushing initial commits");
            return git_repo_in_blog_folder.push(["-u", "origin", "master"]);
          })
          .then(function(){
            callback(null);
          })
          .catch(function(err) {
            callback(err);
          });
      });
    });
  });
};