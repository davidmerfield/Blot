var DropboxSync = require("../../app/clients/dropbox/sync");
var DropboxDatabase = require("../../app/clients/dropbox/database");
var get = require("../get/blog");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;

  console.log(
    "Warning, this uses internal functions of Dropbox client. Syncing blog...",
    blog.handle
  );

  DropboxDatabase.set(blog.id, { cursor: "" }, function(err) {
    if (err) throw err;

    DropboxSync(blog, function(err) {
      if (err) throw err;

      console.log("Synced blog!");
    });
  });
});
