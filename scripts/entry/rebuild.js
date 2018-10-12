var get = require("../blog/get");
var Entry = require("../../app/models/entry");
var build = require("../../app/build");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, process.argv[3], function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, path, callback) {
  console.log("Blog " + blog.id + ":", "Rebuilding", path);
  build(blog, path, {}, function(err, entry) {
    if (err) {
      return callback(err);
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
