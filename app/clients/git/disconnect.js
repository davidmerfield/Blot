var fs = require("fs-extra");
var helper = require("helper");
var localPath = helper.localPath;
var Blog = require("blog");
var Git = require("simple-git");
var debug = require("debug")("clients:git:disconnect");
var database = require("./database");
var dataDir = require("./dataDir");

// Called when the user disconnects the client
// This may occur when the
module.exports = function disconnect(blogID, callback) {
  var liveRepoDirectory = localPath(blogID, "/");
  var liveRepo;

  // Throws an error if directory does not exist
  try {
    liveRepo = Git(liveRepoDirectory).silent(true);
  } catch (err) {
    return callback(err);
  }

  // TODO, this shit should be handled at the next layer up
  // we shouldn't worry about setting blog.client to ""
  Blog.get({ id: blogID }, function(err, blog) {
    if (err || !blog) {
      return callback(err || new Error("No blog"));
    }

    Blog.set(blogID, { client: "" }, function(err) {
      if (err) return callback(err);

      database.flush(blog.owner, function(err) {
        if (err) return callback(err);

        // Remove the bare git repo in /repos
        fs.remove(dataDir + "/" + blog.handle + ".git", function(err) {
          if (err) return callback(err);

          // Remove the .git directory in the user's blog folder?
          // maybe don't do this... they might want it...
          // what if there was a repo in their folder beforehand?
          // fs.remove(localPath(blogID, "/.git"), function(err) {
          //   if (err) return callback(err);

          // });

          // check if blog folder contains git subfolder. this might
          // not be the case if disconnect is called before create.
          // if so, we need to finish early, only invoke this if liveRepo
          // is a repo... otherwise it propagates up to blot repo!
          fs.stat(liveRepoDirectory + "/.git", function(err) {
            if (err && err.code === "ENOENT") {
              debug("No git directory? Had the client been initialized?");
              return callback(null);
            }

            if (err) return callback(err);

            liveRepo.removeRemote("origin", function(err) {
              if (err && err.indexOf("No such remote: origin" > -1)) err = null;

              if (err) return callback(new Error(err));

              callback(null);
            });
          });
        });
      });
    });
  });
};
