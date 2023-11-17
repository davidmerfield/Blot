const Blog = require("models/blog");
const entryGhosts = require("./entry-ghosts");
const listGhosts = require("./list-ghosts");
const menuGhosts = require("./menu-ghosts");
const tagGhosts = require("./tag-ghosts");
const async = require("async");

module.exports = function (blog, callback) {
  if (!blog) {
    throw new TypeError("Fix: Expected blog as first argument");
  }

  if (typeof callback !== "function") {
    throw new TypeError("Fix: Expected callback as second argument");
  }

  const finalReport = {};

  async.eachSeries(
    [
      // entryGhosts,
      tagGhosts,
      listGhosts,
      menuGhosts,
      function (blog, callback) {
        const cacheID = Date.now();
        Blog.set(blog.id, { cacheID }, function (err) {
          if (err) return callback(err);
          callback();
        });
      }
    ],
    function (fn, next) {
      fn(blog, function (err, report) {
        if (err) return next(err);
        if (report && report.length) finalReport[fn.name] = report;
        next();
      });
    },
    function (err) {
      callback(err, finalReport);
    }
  );
};
