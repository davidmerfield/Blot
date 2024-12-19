var createClient = require("clients/dropbox/util/createClient");
var get = require("../get/blog");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  var path = process.argv[3] || "";

  console.log(
    "Warning, this uses internal functions of Dropbox client. Listing contents of " +
      path +
      "...",
    blog.handle
  );

  createClient(blog.id, function (err, client, account) {
    if (err) throw err;

    console.log('Listing path at "' + path + '"');

    client
      .filesListFolder({
        path: path,
      })
      .catch(function (err) {
        console.log(err);
      })
      .then(function (res) {
        console.log(res);

        if (res.result && res.result.entries) {
          console.log('----');
          res.result.entries.forEach(function (entry) {
            console.log(entry.name, entry[".tag"]);
          });
        }
        process.exit();
      });
  });
});
