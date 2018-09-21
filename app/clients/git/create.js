var async = require("async");
var fs = require("fs-extra");
var Git = require("simple-git");
var database = require("./database");
var localPath = require("helper").localPath;

// What should create do?
// - should return an error if there is already a git repo in the user's folder
// - should preserve the existing contents of the user's folder
// - should create a bare repository to serve as the source of truth
// - should pull the bare repository into the user's folder
module.exports = function create(blog, callback) {
  var bareRepo;
  var liveRepo;

  var liveRepoDirectory = localPath(blog.id, "/");
  var bareRepoDirectory = __dirname + "/data/" + blog.handle + ".git";
  var tempRepoDirectory = __dirname + "/data/tmp/" + blog.handle;

  var tempRepoGitDirectory = tempRepoDirectory + "/.git";
  var liveRepoGitDirectory = liveRepoDirectory + "/.git";

  var queue = [
    ensureBlogHasNoRepo.bind(this, liveRepoGitDirectory),
    fs.emptyDir.bind(this, tempRepoDirectory),
    fs.emptyDir.bind(this, bareRepoDirectory),
    database.refresh_token.bind(this, blog.id)
  ];

  async.parallel(queue, function(err) {
    if (err) return callback(err);

    bareRepo = Git(bareRepoDirectory).silent(true);
    liveRepo = Git(liveRepoDirectory).silent(true);

    // Create bare repository in git data directory
    // which will serve as source of truth for repo.
    bareRepo.init(true, function(err) {
      if (err) return callback(err);

      bareRepo.clone(bareRepoDirectory, tempRepoDirectory, function(err) {
        if (err) return callback(err);

        // Install the checked out repo's git folder 
        // in the live blog directory. This means we don't
        // have to worry about copying the blog folder's files
        // since there might be many.
        fs.move(tempRepoGitDirectory, liveRepoGitDirectory, function(err) {
          if (err) return callback(err);

          initialCommit(liveRepo, callback);
        });
      });
    });
  });
};

function initialCommit(repo, callback) {
  repo.add("./*", function(err) {
    if (err) return callback(null);

    repo.commit(["-m", "Initial commit"], function(err) {
      if (err) return callback(err);

      repo.push(["-u", "origin", "master"], function(err) {
        if (err) return callback(err);

        callback(null);
      });
    });
  });
}

function ensureBlogHasNoRepo(path, callback) {
  // This should fail if user has git repo already in folder
  // but it doesn't...
  fs.stat(path, function(err) {
    if (!err) return callback(new Error("Git exists"));

    if (err.code !== "ENOENT") return callback(err);

    callback(null);
  });
}
