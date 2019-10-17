var DropboxSync = require("../../app/clients/dropbox/sync");
var get = require("../get/blog");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;

  console.log(
    "Warning, this uses internal functions of Dropbox client. Syncing blog...",
    blog.handle
  );

  console.log(
    'Consider running dropbox client in debug mode: "export DEBUG=clients:dropbox*"'
  );

  DropboxSync(blog, function(err) {
    if (err) throw err;

    console.log("Synced blog!");
  });
});
