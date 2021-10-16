const write = require("clients/google-drive/write");
const get = require("./get-blog");

get(function (err, user, blog) {
  if (err) throw err;
  const path = "foo/bar/baz.txt";
  const contents = "The time is: " + new Date();

  write(blog.id, path, contents, function (err) {
    if (err) throw err;
    console.log("Wrote!");
  });
});
