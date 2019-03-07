var DropboxSync = require("../../app/clients/dropbox/sync");
var DropboxDatabase = require("../../app/clients/dropbox/database");
var get = require("../blog/get");

get(process.argv[2], function(user, blog) {
  console.log(
    "Warning, this uses internal functions of Dropbox client. Syncing blog...",
    blog.handle
  );

  console.log('Consider running dropbox client in debug mode: "export DEBUG=clients:dropbox*"')

  DropboxSync(blog, function(err) {
    if (err) throw err;

    console.log("Synced blog!");
  });
});
