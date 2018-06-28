var fs = require("fs");
var read = require("./read");
var breadcrumbs = require("./breadcrumbs");
var join = require("path").join;
var blog_folder_dir = require("config").blog_folder_dir;

module.exports = function(server) {
  server.get(["/", "/~*"], function(req, res, next) {
    var dir = req.path.slice("/~".length) || "/";

    dir = decodeURIComponent(dir);

    read(req.blog, dir, function render (err, contents, stat) {
      if (err && err.code === "ENOTDIR") {
        return next();
      }

      if (err && err.code === "ENOENT" && dir === "/") {
        return fs.ensureDir(join(blog_folder_dir, req.blog.id), next);
      }

      // If the user has the Dropbox client, case-preserved folder
      // is stored lowercase on disk. So we check that too.
      if (err && err.code === "ENOENT" && dir.toLowerCase() !== dir) {
        return read(req.blog, dir.toLowerCase(), render);
      }

      if (err && err.code === "ENOENT") {
        return next();
      }

      if (err) {
        return next(err);
      }

      res.addLocals({
        breadcrumbs: breadcrumbs(dir),
        stat: stat,
        contents: contents
      });

      res.title("Your folder");
      res.renderDashboard("folder");
    });
  });
};
