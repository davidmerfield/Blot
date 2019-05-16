var buildFromFolder = require("../../../app/models/template").buildFromFolder;
var get = require("../../get/blog");

// This will request a sync lease, then rebuild the blog's templates, then release the lease

get(process.argv[2], function(err, user, blog) {
  
  if (!blog || !blog.id) throw "no blog";

  buildFromFolder(blog.id, function(err) {
    if (err) throw err;

    console.log("Done!");
    process.exit();
  });
});
