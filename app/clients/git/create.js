var fs = require("fs-extra");
var Git = require("simple-git");
var join = require("path").join;
var config = require("config");
var database = require("./database");
var async = require('async');

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
  var blogDirectory = blog_dir(blog.id);
  var bareRepoPath = __dirname + "/data/" + blog.handle + ".git";
  var tmpDirectory = __dirname + '/data/tmp';
  var bareRepo;
  var liveRepo;

  fs.removeSync(tmpDirectory);
  
  fs.move(blogDirectory, tmpDirectory, function(err) {
    if (err) return callback(err);
    fs.mkdir(blogDirectory, function(err) {
      if (err) return callback(err);
      fs.mkdir(bareRepoPath, function(err) {
        if (err) return callback(err);
        fs.readdir(tmpDirectory, function(err, contents) {
          if (contents.indexOf(".git") > -1) {
            return callback(new Error("Git exists"));
          }

          database.refresh_token(blog.id, function(err) {
            if (err) return callback(err);

            bareRepo = Git(bareRepoPath).silent(true);
            liveRepo = Git(blogDirectory).silent(true);

            // Create bare repository in git data directory
            // which will serve as source of truth for repo.
            bareRepo.init(true, function(err) {
              if (err) return callback(err);

              // This should fail if user has git repo already in folder
              // but it doesn't...
              bareRepo.clone(bareRepoPath, blogDirectory, function(err) {
                if (err) return callback(err);

                async.each(
                  contents,
                  function(name, next) {
                    if (name === ".git") return next();

                    fs.move(
                      tmpDirectory + "/" + name,
                      blogDirectory + "/" + name,
                      next
                    );
                  },
                  function(err) {

                    if (err) return callback(err);

                    liveRepo.add("./*", function(err) {
                      if (err) return callback(null);

                      // if (err) return callback(err);

                      liveRepo.commit(["-m", "Initial commit"], function(err) {
                        if (err) return callback(err);
                        liveRepo.push(["-u", "origin", "master"], function(
                          err
                        ) {
                          if (err) return callback(err);

                          callback(null);
                        });
                      });
                    });
                  }
                );
              });
            });
          });
        });
      });
    });
  });

  // repos.create(blog.handle, function(err) {
  //   if (err) return callback(err);

  //   bare_git_repo = Git(__dirname + "/data/" + blog.handle + ".git").silent(true);

  //   fs.copy(blog_folder, tmp_folder)
  //     .then(function() {
  //       debug(blog.id, "Emptying blog folder");
  //       return fs.emptyDir(blog_folder);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Cloning bare repository");
  //       return bare_git_repo.clone(bare_repo_path, blog_folder);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Copying tmp folder");
  //       return fs.copy(tmp_folder, blog_folder);
  //     })
  //     .then(function() {
  //       git_repo_in_blog_folder = Git(blog_folder).silent(true);
  //       debug(blog.id, "Removing tmp folder");
  //       return fs.remove(tmp_folder);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Writing placeholder");
  //       return fs.outputFile(placeholder_path, "", "utf-8");
  //     })
  //     .then(function() {
  //       debug(blog.id, "Adding placeholder to checked out repo");
  //       return git_repo_in_blog_folder.add("./*");
  //     })
  //     .then(function() {
  //       debug(blog.id, "Commiting placeholder in checked out repo");
  //       return git_repo_in_blog_folder.commit(["-m", "Initial commit"]);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Removing placeholder");
  //       return fs.remove(placeholder_path);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Adding removed placeholder to index");
  //       return git_repo_in_blog_folder.add("./*");
  //     })
  //     .then(function() {
  //       debug(blog.id, "Commiting removed placeholder");
  //       return git_repo_in_blog_folder.commit([
  //         "-m",
  //         "Removed placeholder file"
  //       ]);
  //     })
  //     .then(function() {
  //       debug(blog.id, "Pushing initial commits");
  //       return git_repo_in_blog_folder.push(["-u", "origin", "master"]);
  //     })
  //     .then(function(){
  //       callback(null);
  //     })
  //     .catch(function(err) {
  //       callback(err);
  //     });
  // });
  // });
};
