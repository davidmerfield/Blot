var get = require("./get");
var sync = require("../../app/sync");

// This will request a sync lease, then rebuild the blog's templates, then release the lease

get(process.argv[2], function(user, blog) {
  if (!blog || !blog.id) throw "no blog";

  sync(
    blog.id,
    function(callback) {
      callback();
    },
    function(err) {
      process.exit();
    }
  );
});
