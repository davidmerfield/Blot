const client = require("models/client");
const key = require("./key");
const pathNormalizer = require("helper/pathNormalizer");

// retrives the case preserved path for
// a given path
module.exports = function getPath(blogID, input, callback) {
  const path = pathNormalizer(input);
  const dirs = path.split("/");
  const paths = dirs.map((dir, index) => dirs.slice(0, index + 1).join("/"));
  const keys = paths.map((path) => key.path(blogID, path));

  client.MGET(keys, function (err, dirsWithCase) {
    if (err) return callback(err);

    const pathWithCase = dirsWithCase
      .map((dir, index) => dir || dirs[index])
      .join("/");

    callback(null, pathWithCase);
  });
};
