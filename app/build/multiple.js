const single = require("./single");
const async = require("async");
const fs = require("fs-extra");
const localPath = require("helper/localPath");
const { dirname, join } = require("path");
const debug = require("debug")("blot:build:multiple");
const alphanum = require("helper/alphanum");

function determinePaths(blog, path) {
  const parentDirectory = dirname(path);
  const contents = fs.readdirSync(localPath(blog.id, parentDirectory));
  const paths = contents.map((p) => join(parentDirectory, p)).sort();
  return { newPath: parentDirectory, paths: alphanum(paths) };
}

function multiple(blog, path, options, callback) {
  const { paths, newPath } = determinePaths(blog, path);

  let finalHtml = "";
  let finalMetadata = {};
  let finalStat;
  let finalDependencies = [];

  debug("paths", paths);
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
        debug("metadata", metadata);
        debug("html", html);
        debug("dependencies", dependencies);

        // todo: work out which params we need to aggregate
        finalStat = stat;

        finalHtml += html + "\n";
        finalMetadata = { ...finalMetadata, ...metadata };
        finalDependencies = finalDependencies.concat(dependencies);
        next();
      });
    },
    function (err) {
      if (err) return callback(err);
      // merge HTML and metadata here...
      // dependencies...
      finalHtml = finalHtml.trim();

      debug("finalMetadata", finalMetadata);
      debug("finalHtml", finalHtml);
      debug("finalDependencies", finalDependencies);
      debug("finalStat", finalStat);

      callback(
        null,
        finalHtml,
        finalMetadata,
        finalStat,
        finalDependencies,
        newPath
      );
    }
  );
}

module.exports = multiple;
