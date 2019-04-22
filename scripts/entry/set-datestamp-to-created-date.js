var get = require("../get/entry");
var sync = require("../../app/sync");
var Entry = require("../../app/models/entry");

if (!process.argv[2]) {
  console.log(
    "Please pass a URL to a blog post or source file as the first and only argument to this script. Blot will rebuild the entry which exists at that URL."
  );
  process.exit();
}

get(process.argv[2], function(err, user, blog, entry) {
  if (err) throw err;
  sync(blog.id, function(err, folder, done) {
    if (err) throw err;

    console.log(
      "Changing entry dateStamp from",
      entry.dateStamp,
      "to",
      entry.created
    );

    Entry.set(blog.id, entry.path, { dateStamp: entry.created }, function(err) {
      if (err) throw err;
      done(null, function(err) {
        if (err) throw err;
        console.log("Rebuilt:", process.argv[2]);
        process.exit();
      });
    });
  });
});
