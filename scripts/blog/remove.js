var Blog = require("blog");
var yesno = require("yesno");

// We don't use get() since it throws an error if the user does not
// exist and sometimes with want to be able to clean up blogs
Blog.get({ handle: process.argv[2] }, function(err, blogFromHandle) {
  Blog.get({ domain: process.argv[2] }, function(err, blogFromDomain) {
    Blog.get({ id: process.argv[2] }, function(err, blogFromID) {
      var blog = blogFromID || blogFromHandle || blogFromDomain;

      if (!blog || !blog.id) throw new Error("No blog: " + process.argv[2]);

      yesno.ask(
        "Delete " + blog.id + " " + blog.handle + "? (y/N)",
        false,
        function(ok) {
          if (!ok) throw new Error("Not ok!");

          // We need to enable the blog to disconnect the client
          // since we need to acquire a sync lock...
          Blog.set(blog.id, { isDisabled: false }, function(err) {
            Blog.remove(blog.id, function(err) {
              if (err) throw err;
              console.log("Deleted", blog.id, blog.handle);
              process.exit();
            });
          });
        }
      );
    });
  });
});
