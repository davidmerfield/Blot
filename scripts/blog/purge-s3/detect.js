var Entries = require("entries");
var Blog = require("blog");
var User = require("user");
var CDN = "blotcdn.com";

function main(blog, next) {
  Blog.get({ id: blog.id }, function(err, blog) {
    if (err || !blog) return next();

    User.getById(blog.owner, function(err, user) {
      if (err || !user) return next();

      if (JSON.stringify(user).indexOf(CDN) > -1) {
        var listInUser = [];
        for (var x in user) if (user[x].indexOf(CDN) > -1) listInUser.push(x);
        console.log(user.uid, "references CDN in", listInUser);
      }

      if (JSON.stringify(blog).indexOf(CDN) > -1) {
        var listInBlog = [];
        for (var i in blog)
          if (blog[i].toString().indexOf(CDN) > -1) listInBlog.push(i);

        console.log(blog.handle, blog.id, "references CDN in", listInBlog);
      }

      Entries.each(
        blog.id,
        function(entry, next) {
          if (JSON.stringify(entry).indexOf(CDN) > -1) {
            var listInEntry = [];
            for (var y in entry)
              if (entry[y].toString().indexOf(CDN) > -1) listInEntry.push(y);

            console.log(blog.handle, blog.id, entry.id, "references CDN in", listInEntry);
          }
          next();
        },
        next
      );
    });
  });
}

if (require.main === module) require("./util/cli")(main, {skipAsk: true});

module.exports = main;
