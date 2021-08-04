var get = require("../get/entry");
var Entry = require("entry");

get(process.argv[2], function (err, user, blog, entry) {
  if (err) throw err;
  Entry.drop(blog.id, entry.path, function (err) {
    if (err) throw err;

    console.log(blog.handle, entry.path, "was deleted!");
    process.exit();
  });
});
