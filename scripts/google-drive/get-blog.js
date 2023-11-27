const get = require("../get/blog");
const config = require("config");
const Blog = require("models/blog");

module.exports = function (cb) {
  if (process.argv[2] && process.argv[2][0] !== '-') {
    get(process.argv[2], cb);
  } else if (config.environment === "development") {
    Blog.getAllIDs(function (err, ids) {
      get(ids[0], cb);
    });
  } else {
    throw new Error("No blog to get!");
  }
};
