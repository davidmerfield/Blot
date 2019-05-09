// - regenerate all thumbnails in blog posts which contain a link to blotcdn
// - regenerate all cached images in blog posts which point to blotcdn
// - check head for links to blotcdn

// perhaps in seperate script
// - delete folder on s3 which corresponds

var Blog = require("blog");
var User = require("user");
var CDN = "blotcdn.com";
var async = require("async");

if (require.main === module)
  main(function(err) {
    if (err) throw err;
    console.log("Done!");
    process.exit();
  });

function main(callback) {
  Blog.getAllIDs(function(err, blogIDs) {
    async.each(
      blogIDs,
      function(blogID, next) {
        Blog.get({ id: blogID }, function(err, blog) {
          if (err || !blog) return next();

          User.getById(blog.owner, function(err, user) {
            if (err || !user) return next();

            if (JSON.stringify(blog).indexOf(CDN) > -1) {
              console.log(blog.id, "contains reference to CDN");
              for (var i in blog)
                if (blog[i].toString().indexOf(CDN) > -1) console.log("-", i, blog[i]);
            }

            if (JSON.stringify(user).indexOf(CDN) > -1) {
              console.log(user.uid, "contains reference to CDN");
              for (var x in user)
                if (user[x].indexOf(CDN) > -1) console.log("-", x, user[x]);
            }

            // console.log("Checked", blog.id, blog.handle);
            next();
          });
        });
      },
      callback
    );
  });
}

module.exports = main;
