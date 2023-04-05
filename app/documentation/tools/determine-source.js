const { join } = require("path");
const fs = require("fs-extra");
const rootDir = require("helper/rootDir");
const moment = require("moment");
var Git = require("simple-git");

module.exports = function determineSource(req, res, next) {
  let validPath;
  let git;
  try {
    const path = require("url").parse(req.originalUrl).pathname;

    let paths;

    if (path === "/about/news") {
      paths = ["/todo.txt"];
    } else if (path.startsWith("/about/notes")) {
      paths = [
        join(path.slice("/about".length) + ".txt"),
        join(path.slice("/about".length), "README"),
      ];
    } else {
      paths = [
        join("/app/views", path + ".html"),
        join("/app/views", path, "index.html"),
      ];
    }

    validPath = paths.filter((i) => fs.existsSync(join(rootDir, i))).pop();

    if (!validPath) {
      return next();
    }

    git = Git(rootDir).silent(true);
  } catch (e) {
    console.log("Error looking up source file:", e);
    return next();
  }

  git.raw(
    ["log", "-1", "--pretty=%ci", `${join(rootDir, validPath)}`],
    function (err, date) {
      if (err) {
        console.log("Error looking up source file:", err);
        return next();
      }

      if (!date) return next();

      date = new Date(date);

      res.locals.sourceFile = validPath;
      res.locals.sourceFileUpdated = moment(date).fromNow();
      next();
    }
  );
};
