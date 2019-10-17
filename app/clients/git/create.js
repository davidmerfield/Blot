var async = require("async");
var fs = require("fs-extra");
var Git = require("simple-git");
var database = require("./database");
var localPath = require("helper").localPath;
var dataDir = require("./dataDir");

// What should create do?
// - should it return an error if there is already a git repo in the user's folder?
// - should preserve the existing contents of the user's folder
// - should create a bare repository to serve as the source of truth
// - should pull the bare repository into the user's folder
module.exports = function create(blog, callback) {
  var bareRepo;
  var liveRepo;

  var liveRepoDirectory = localPath(blog.id, "/");
  var bareRepoDirectory = dataDir + "/" + blog.handle + ".git";

  var queue = [
    fs.mkdir.bind(this, bareRepoDirectory),
    database.createToken.bind(this, blog.owner)
  ];

  async.parallel(queue, function(err) {
    if (err) return callback(err);

    // Throws an error if the directory does not exist
    try {
      bareRepo = Git(bareRepoDirectory).silent(true);
      liveRepo = Git(liveRepoDirectory).silent(true);
    } catch (err) {
      return callback(err);
    }

    // Simple git returns stderr as a string
    // so we produce a new error from it...
    liveRepo.init(function(err) {
      if (err) return callback(new Error(err));

      liveRepo.addRemote("origin", bareRepoDirectory, function(err) {
        if (err) return callback(new Error(err));

        // Create bare repository in git data directory
        // which will serve as source of truth for repo.
        bareRepo.init(true, function(err) {
          if (err) return callback(new Error(err));

          liveRepo.add(".", function(err) {
            liveRepo.commit(
              "Initial commit",
              { "--allow-empty": true },
              function(err) {
                if (err) return callback(new Error(err));

                liveRepo.push(["-u", "origin", "master"], function(err) {
                  if (err) return callback(new Error(err));

                  callback(null);
                });
              }
            );
          });
        });
      });
    });
  });
};
