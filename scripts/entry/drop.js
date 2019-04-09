var get = require("../blog/get");
var Entry = require("entry");

if (require.main === module) {
  get(process.argv[2], function(user, blog) {
    main(blog, process.argv[3], function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function main(blog, path, callback) {
  Entry.get(blog.id, [path], function(entries) {
    if (!entries[0]) throw new Error("NOENTRY " + path);

    Entry.drop(blog.id, entries[0], function(err) {
      if (err) throw err;

      console.log(blog.handle, entry.path, "was deleted!");
      callback();
    });
  });
}
