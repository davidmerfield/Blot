const write = require("clients/google-drive/write");
const get = require("../get/blog");

get(process.argv[2], function (err, user, blog) {
  write(blog.id, "foo/bar/baz.txt", "The time is: " + new Date(), function (err) {
    if (err) throw err;
    console.log("Wrote!");
    setTimeout(function () {}, 1000000000);
  });
});
