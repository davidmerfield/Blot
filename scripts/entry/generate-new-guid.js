var Entry = require("models/entry");
var get = require("../get/entry");
var guid = require("helper/guid");

get(process.argv[2], function (err, user, blog, entry) {
  if (err) throw err;

  console.log("Old GUID:", entry.guid);

  entry.guid = "entry_" + guid();

  console.log("New GUID:", entry.guid);

  Entry.set(blog.id, entry.path, entry, function (err) {
    if (err) throw err;

    console.log("Refreshed GUID of entry:", process.argv[2]);
  });
});
