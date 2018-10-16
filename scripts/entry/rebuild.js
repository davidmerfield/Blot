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
    console.log("Back with", err, entry);

    if (err) return callback(err);

    console.log("Saving entry...");
    Entry.set(blog.id, path, entry, function(err) {
      if (err) return callback(err);

      console.log("Blog " + blog.id + ":", "Rebuilt", path);
      callback(null);
    });
  });
}
