const Blog = require("models/blog");
const entryGhosts = require("./entry-ghosts");
const listGhosts = require("./list-ghosts");
const menuGhosts = require("./menu-ghosts");
const tagGhosts = require("./tag-ghosts");

module.exports = function (blog, callback) {
  if (!blog) {
    throw new TypeError("Fix: Expected blog as first argument");
  }

  if (typeof callback !== "function") {
    throw new TypeError("Fix: Expected callback as second argument");
  }

  const finalReport = {};

  entryGhosts(blog, function (err, report) {
    if (err) return callback(err);
    if (report && report.length) finalReport.entryGhosts = report;
    tagGhosts(blog, function (err, report) {
      if (err) return callback(err);
      if (report && report.length) finalReport.tagGhosts = report;
      listGhosts(blog, function (err, report) {
        if (err) return callback(err);
        if (report && report.length) finalReport.listGhosts = report;
        menuGhosts(blog, function (err, report) {
          if (err) return callback(err);
          if (report && report.length) finalReport.menuGhosts = report;
          const cacheID = Date.now();
          Blog.set(blog.id, { cacheID }, function (err) {
            if (err) return callback(err);
            callback(null, finalReport);
          });
        });
      });
    });
  });
};
