var helper = require("../../app/helper");
var fs = require("fs-extra");
var localRoot = helper.rootDir;
var remoteRoot = require("./root");
var exec = require("child_process").exec;

function inside(dir, root) {
  if (dir.indexOf(root) !== 0) {
    console.log("Root:", root);
    console.log("Dir:", dir);
    throw "Directory is not inside the root";
  }
}

module.exports = function(remotedir, localdir, callback) {
  inside(localdir, localRoot);
  inside(remotedir, remoteRoot);

  fs.ensureDir(localdir, function(err) {
    if (err) throw err;

    exec(
      "rsync -avL --progress -e ssh blot:" + remotedir + "/* " + localdir,
      function(code, stdout, stderr) {
        if (code) return callback(code + stdout + stderr);

        callback(null, stdout);
      }
    );
  });
};
