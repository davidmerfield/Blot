var DropboxDatabase = require("../../app/clients/dropbox/database");
var createClient = require("../../app/clients/dropbox/util/createClient");
var get = require("../get/blog");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;
  
  var path = process.argv[3] || "";

  console.log(
    "Warning, this uses internal functions of Dropbox client. Listing contents of " +
      path +
      "...",
    blog.handle
  );

  DropboxDatabase.get(blog.id, function(err, account) {
    if (err) throw err;

    var client = createClient(account.access_token);

    client
      .filesListFolder({
        path: path
      })
      .catch(function(err) {
        console.log(err);
      })
      .then(function(res) {
        console.log(res);
        process.exit();
      });
  });
});
