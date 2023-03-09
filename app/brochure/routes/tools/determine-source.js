const { join } = require("path");
const fs = require("fs-extra");
const { execSync } = require("child_process");
const rootDir = require("helper/rootDir");
const moment = require("moment");

module.exports = function determineSource(req, res, next) {
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
        join("/app/brochure/views", path + ".html"),
        join("/app/brochure/views", path, "index.html"),
      ];
    }

    const validPath = paths
      .filter((i) => fs.existsSync(join(rootDir, i)))
      .pop();

    if (!validPath) {
      return next();
    }

    const date = execSync(
      `git log -1 --pretty="format:%ci" ${join(rootDir, validPath)}`
    ).toString();

    res.locals.sourceFile = validPath;
    res.locals.sourceFileUpdated = moment(date).fromNow();

    next();
  } catch (e) {
    console.log("Error looking up source file:", e);
    next();
  }
};
