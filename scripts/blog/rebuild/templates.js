var buildFromFolder = require("../../app/modules/template").update;
var get = require("./get");

// This will request a sync lease, then rebuild the blog's templates, then release the lease

get(process.argv[2], function(user, blog) {
  
  if (!blog || !blog.id) throw "no blog";

  buildFromFolder(blog.id, function(err) {
    if (err) throw err;

    console.log("done!");
    process.exit();
  });
});
