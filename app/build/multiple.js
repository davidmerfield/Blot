const single = require("./single");
const async = require("async");

function multiple(blog, path, options, callback) {
  const paths = determinePaths(blog, path);

  let html = "";
  let metadata = {};
  let stat;
  let dependencies = [];

  async.eachSeries(
    paths,
    function (path, next) {
      single(blog, path, options, function (
        err,
        html,
        metadata,
        stat,
        dependencies
      ) {
        if (err) return next(err);
      });
    },
    function (err) {
      if (err) return callback(err);
      // merge HTML and metadata here...
      // dependencies...
      callback(null, html, metadata, stat, dependencies);
    }
  );
}

module.exports = multiple;
