var get = require("../get/entry");
var sync = require("../../app/sync");
var wipeCaches = require("./wipe-image-and-thumbnail-cache");

if (!process.argv[2]) {
  console.log(
    "Please pass a URL to a blog post or file to this script. Blot will rebuild the entry which exists at that URL."
  );
  process.exit();
}

// Will rebuild and recache any thumbnails or images
console.log("Getting info from:", process.argv[2]);
var path;

get(process.argv[2], function (err, user, blog, entry) {
  if (err && err.message !== "No entry") throw err;

  if (entry) {
    path = entry.path;
  } else {
    path = decodeURIComponent(require("url").parse(process.argv[2]).path);
  }

  console.log("Starting sync for", blog.handle);
  sync(blog.id, function (err, folder, done) {
    if (err) throw err;

    wipeCaches(process.argv[2], function (err) {
      if (err) console.log(err);

      folder.update(path, function (err) {
        if (err) throw err;
        done(null, function (err) {
          if (err) throw err;
          console.log("Rebuilt:", process.argv[2]);
          process.exit();
        });
      });
    });
  });
});
