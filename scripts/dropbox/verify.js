var verify = require("clients/dropbox/verify");
var get = require("../get/blog");

get(process.argv[2], function (err, user, blog) {
  if (err) throw err;

  console.log(
    "Warning, this uses internal functions of Dropbox client. Verifying blog...",
    blog.handle
  );

  verify(blog.id, function (err) {
    if (err) throw err;

    console.log("Verified blog!");
  });
});
