var Git = require("simple-git");
var debug = require("debug")("blot:clients:git:checkGitRepoExists");
var fs = require("fs-extra");

module.exports = function(blogDirectory, callback) {
  var git;

  // Throws an error if folder does not exist
  try {
    git = Git(blogDirectory).silent(true);
  } catch (err) {
    return callback(err);
  }

  // We want to compare the path to the blog folder with the path
  // to the repository that simple-git is operating on. It is not
  // as simple as just checking Git.checkIsRepo() because all of the
  // blogs git repos are inside the Blot codebase git repo. This means
  // that Git.checkIsRepo() ALWAYS returns true even if there is no
  // repo in the user's blog's folder. So we use this git command which
  // tells us the top level of the current git repository:

  git.revparse(["--show-toplevel"], function(err, pathToGitRepository) {
    if (err) {
      return callback(new Error(err));
    }

    // Has a space at the start, in my testing at least
    pathToGitRepository = pathToGitRepository.trim();

    debug("Comparing path to git repository and blog folder:");

    if (pathToGitRepository !== blogDirectory) {
      var message = [
        "Git repo does not exist in blog folder for " + blogDirectory,
        "- Path to git: " + pathToGitRepository,
        "- Blog folder: " +
          blogDirectory +
          " exists? " +
          fs.existsSync(blogDirectory),
        "Match? " + pathToGitRepository === blogDirectory
      ];

      return callback(new Error(message.join("\n")));
    }

    callback(null);
  });
};
