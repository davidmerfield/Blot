// - regenerate all thumbnails in blog posts which contain a link to blotcdn
// - regenerate all cached images in blog posts which point to blotcdn
// - check head for links to blotcdn

// perhaps in seperate script
// - delete folder on s3 which corresponds

var Entries = require("entries");
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
    async.eachSeries(
      blogIDs,
      function(blogID, next) {
        console.log(blogID);

        Blog.get({ id: blogID }, function(err, blog) {
          if (err || !blog) return next();

          User.getById(blog.owner, function(err, user) {
            if (err || !user) return next();

            if (JSON.stringify(user).indexOf(CDN) > -1) {
              var listInUser = [];
              for (var x in user)
                if (user[x].indexOf(CDN) > -1) listInUser.push(x);
              console.log(user.uid, "references CDN in", listInUser);
            }

            if (JSON.stringify(blog).indexOf(CDN) > -1) {
              var listInBlog = [];
              for (var i in blog)
                if (blog[i].toString().indexOf(CDN) > -1) listInBlog.push(i);

              console.log(blog.id, "references CDN in", listInBlog);
            }

            Entries.each(
              blogID,
              function(entry, next) {
                if (JSON.stringify(entry).indexOf(CDN) > -1) {
                  var listInEntry = [];
                  for (var y in entry)
                    if (entry[y].toString().indexOf(CDN) > -1)
                      listInEntry.push(y);

                  console.log(
                    blog.id,
                    entry.id,
                    "references CDN in",
                    listInEntry
                  );
                }
                next();
              },
              next
            );
          });
        });
      },
      callback
    );
  });
}

module.exports = main;
