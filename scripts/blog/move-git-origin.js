const each = require("../each/blog");
const Git = require("simple-git");
const localPath = require("helper/localPath");
const dataDir = require("clients/git/dataDir");
const { basename } = require("path");
const sync = require("clients/git/sync");
each(
  function (user, blog, next) {
    if (blog.client !== "git") return next();

    let liveRepo;
    let bareRepo;

    const liveRepoDirectory = localPath(blog.id, "/");
    const bareRepoDirectory = dataDir + "/" + blog.handle + ".git";

    // Throws an error if the directories does not exist
    try {
      liveRepo = Git(liveRepoDirectory).silent(true);
    } catch (err) {
      return next(err);
    }

    liveRepo.revparse(["--show-toplevel"], function (err, path) {
      if (err) return next(new Error(err));

      if (basename(path) !== blog.id) {
        console.log(
          new Error(`liverepo ${blog.id} is not in the correct folder: ${path}`)
        );
        return next();
      }

      liveRepo.removeRemote("origin", function (err) {
        if (err) return next(new Error(err));
        liveRepo.addRemote("origin", bareRepoDirectory, function (err) {
          if (err) return next(new Error(err));
          console.log(blog.id, blog.handle, bareRepoDirectory);
          sync(blog.id, function (err) {
            if (err) console.log(err);
            next();
          });
        });
      });
    });
  },
  err => {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  }
);
