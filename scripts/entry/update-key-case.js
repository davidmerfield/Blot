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
        const candidates = [];

        // entry key
        candidates.push({
          oldKey: "blog:" + blog.id + ":entry:" + oldPathNormalize(path),
          newKey: "blog:" + blog.id + ":entry:" + pathNormalizer(path),
        });

        // dependency key
        candidates.push({
          oldKey: "blog:" + blog.id + ":dependents:" + oldPathNormalize(path),
          newKey: "blog:" + blog.id + ":dependents:" + pathNormalizer(path),
        });

        async.eachSeries(
          candidates,
          ({ oldKey, newKey }, next) => {
            if (!oldKey) return next(new Error("Missing oldKey!"));
            if (!newKey) return next(new Error("Missing newKey!"));
            if (oldKey === newKey) return next();

            client.exists(oldKey, function (err, exists) {
              if (err) return next(err);

              if (exists) {
                console.log("renaming key:");
                console.log(oldKey);
                console.log(newKey);
                console.log();
                multi.rename(oldKey, newKey);
              } else {
              }
              next();
            });
          },
          next
        );
      },
      function (err) {
        if (err) throw err;
        multi.exec(function (err, stat) {
          if (err) throw err;
            console.log("Blog:", blog.id, "stat:", stat);
          next();
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
