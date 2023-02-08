const eachEntry = require("../each/entry");
const eachBlog = require("../each/blog");
const ensure = require("helper/ensure");
const options = require("minimist")(process.argv.slice(2));
const client = require("client");

const pathNormalizer = require("helper/pathNormalizer");

const handle = (user, blog, entry, next) => {
  const oldKey = "blog:" + blog.id + ":entry:" + oldPathNormalize(entry.path);
  const newKey = "blog:" + blog.id + ":entry:" + pathNormalizer(entry.path);

  const oldDepKey =
    "blog:" + blog.id + ":dependents:" + oldPathNormalize(entry.path);
  const newDepKey =
    "blog:" + blog.id + ":dependents:" + pathNormalizer(entry.path);

  if (oldKey === newKey && oldDepKey === newDepKey) return next();

  console.log("updating keys:");

  const multi = client.multi();

  multi.rename(oldKey, newKey);
  multi.rename(oldDepKey, newDepKey);

  multi.exec(function (err, stat) {
    if (err) throw err;
    console.log("Stat:", stat);
    next();
  });
};

const handleBlog = (user, blog, next) => {
  client.hgetall("blog:" + blog.id + ":ignored_files", function (
    err,
    ignoredFilePaths
  ) {
    if (err) throw err;
    console.log(ignoredFilePaths);
    next();
  });
};

eachEntry(
  handle,
  function (err) {
    if (err) throw err;
    console.log("Finished each entry");
    eachBlog(
      handleBlog,
      function (err) {
        if (err) throw err;
        console.log("Finished each blog");
        process.exit();
      },
      options
    );
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
