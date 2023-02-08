const eachBlog = require("../each/blog");
const ensure = require("helper/ensure");
const options = require("minimist")(process.argv.slice(2));
const client = require("client");
const async = require("async");

const pathNormalizer = require("helper/pathNormalizer");

const handleBlog = (user, blog, next) => {
  client.zrevrange("blog:" + blog.id + ":all", 0, -1, function (err, ids) {
    if (err) throw err;
    const multi = client.multi();

    async.eachSeries(
      ids,
      (path, next) => {
        const oldKey = "blog:" + blog.id + ":entry:" + oldPathNormalize(path);
        const newKey = "blog:" + blog.id + ":entry:" + pathNormalizer(path);

        const oldDepKey =
          "blog:" + blog.id + ":dependents:" + oldPathNormalize(path);
        const newDepKey =
          "blog:" + blog.id + ":dependents:" + pathNormalizer(path);

        if (oldKey === newKey && oldDepKey === newDepKey) return next();

        client.exists(oldKey, function (err, exists) {
          if (exists) {
            console.log("updating:", oldKey, "=>", newKey);
            multi.rename(oldKey, newKey);
          } else {
          }

          client.exists(oldDepKey, function (err, exists) {
            if (exists) {
              console.log("updating:", oldDepKey, "=>", newDepKey);
              multi.rename(oldDepKey, newDepKey);
            } else {
            }

            next();
          });
        });
      },
      function (err) {
        if (err) throw err;

        multi.exec(function (err, stat) {
          if (err) throw err;
          console.log("Stat:", stat);

          client.hgetall("blog:" + blog.id + ":ignored_files", function (
            err,
            ignoredFilePaths
          ) {
            if (err) throw err;
            console.log(ignoredFilePaths);
            next();
          });
        });
      }
    );
  });
};

eachBlog(
  handleBlog,
  function (err) {
    if (err) throw err;
    console.log("Finished each blog");
    process.exit();
  },
  options
);

function oldPathNormalize(path) {
  ensure(path, "string");

  if (!path) return "";

  path = path.trim().toLowerCase();

  path = path.split("//").join("/");

  // Remove trailing slash
  if (path.slice(-1) === "/") path = path.slice(0, -1);

  // Add leading slash
  if (path[0] !== "/") path = "/" + path;

  return path;
}
