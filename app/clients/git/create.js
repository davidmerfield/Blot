var async = require("async");
var fs = require("fs-extra");
var Git = require("simple-git");
var database = require("./database");
var localPath = require("helper/localPath");
var dataDir = require("./dataDir");
var clfdate = require("helper/clfdate");

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
    database.createToken.bind(this, blog.owner),
  ];

  console.log(
    clfdate() + " Git: create: making bareRepoDirectory and creating token"
  );
  async.parallel(queue, function (err) {
    if (err) return callback(err);

    // Throws an error if the directory does not exist
    try {
      bareRepo = Git(bareRepoDirectory).silent(true);
      liveRepo = Git(liveRepoDirectory).silent(true);
    } catch (err) {
      return callback(err);
    }

    console.log(clfdate() + " Git: create: initing liveRepo");

    // Simple git returns stderr as a string
    // so we produce a new error from it...
    liveRepo.init(function (err) {
      if (err) return callback(new Error(err));

      console.log(clfdate() + " Git: create: adding remote to liveRepo");
      liveRepo.addRemote("origin", bareRepoDirectory, function (err) {
        if (err) return callback(new Error(err));

        // Create bare repository in git data directory
        // which will serve as source of truth for repo.
        console.log(clfdate() + " Git: create: initing bareRepo");
        bareRepo.init(true, function (err) {
          if (err) return callback(new Error(err));

          console.log(
            clfdate() + " Git: create: adding existing folder to liveRepo"
          );
          liveRepo.add(".", function (err) {
            if (err) return callback(new Error(err));
            console.log(
              clfdate() + " Git: create: commiting existing folder to liveRepo"
            );
            liveRepo.commit(
              "Initial commit",
              { "--allow-empty": true },
              function (err) {
                if (err) return callback(new Error(err));

                console.log(
                  clfdate() +
                    " Git: create: pushing existing folder to liveRepo"
                );
                liveRepo.push(["-u", "origin", "master"], function (err) {
                  if (err) return callback(new Error(err));

                  console.log(clfdate() + " Git: create: complete");
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
