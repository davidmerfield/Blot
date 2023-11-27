var each = require("../each/blog");
var gitDatabase = require("clients/git/database");
var yesno = require("yesno");

yesno.ask(
  "Do you want to reset the git token for all blogs? (y/n)",
  false,
  function (ok) {
    if (!ok) {
      return process.exit();
    }

    console.log("Resetting tokens...");
    each(function (user, blog, next) {
      if (blog.client !== "git") return next();
      gitDatabase.refreshToken(user.uid, function (err) {
        if (err) throw err;
        console.log("reset token for", blog.id, blog.handle);
        next();
      });
    }, process.exit);
  }
);
