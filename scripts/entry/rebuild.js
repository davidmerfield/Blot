var set = require("../../app/sync").change.set;
var get = require("../blog/get");

var handle = process.argv[2];
var path = process.argv[3];

if (!handle) {
  console.log("- pass a handle as the first argument");
}

if (!path) {
  console.log("- pass a path in the blog's folder as a second argument");
}

if (!handle || !path) {
  return process.exit();
}

if (path[0] !== "/") path = "/" + path;

if (path.slice(-1) === "/") path = path.slice(0, -1);

get(handle, function(user, blog) {
  var options = {};

  console.log("Rebuilding", blog.handle, path);

  set(blog, path, options, function(err) {
    if (err) console.log(err);

    process.exit();
  });
});
