const remove = require("clients/google-drive/remove");
const get = require("./get-blog");

get(function (err, user, blog) {
  if (err) throw err;
  remove(blog.id, "foo/bar/baz.txt", function (err) {
    if (err) throw err;
    console.log("Removed!");
  });
});
