var get = require("./get");
var sync = require("../../app/sync");

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
