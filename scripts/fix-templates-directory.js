var eachBlog = require("./each/blog");
var helper = require("../app/helper");
var localPath = helper.localPath;
var fs = require("fs-extra");
var yesno = require("yesno");

eachBlog(function(user, blog, next) {
  if (blog.client !== "dropbox") return next();

  var directories = fs.readdirSync(localPath(blog.id, "/"));
  var removeDirectory = localPath(blog.id, "/Templates");
  var conflictingDirectory = localPath(blog.id, "/templates");

  if (
    directories.indexOf("Templates") === -1 ||
    directories.indexOf("templates") === -1
  ) {
    return next();
  }

  console.log("Blog:", blog.id, "Has conflicting template directories:");
  console.log(
    "-",
    conflictingDirectory,
    "(fs.existsSync is " + fs.existsSync(conflictingDirectory) + ")"
  );
  console.log(
    "-",
    removeDirectory,
    "(fs.existsSync is " + fs.existsSync(removeDirectory) + ")"
  );

  yesno.ask("Remove " + removeDirectory + "? (y/n)", false, function(ok) {
    if (ok) {
      fs.remove(removeDirectory, function(err) {
        if (err) throw err;
        next();
      });
    } else {
      console.log("Did not remove directory.");
      next();
    }
  });
}, process.exit);
