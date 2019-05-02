// This script will edit the ID of a blog
// Run this on my blogs in production first
// before incrementally rolling it out to 
// ensure all blogs have IDs which are guuids

// Things to think about:

// acquire a sync lock for the blog before doing any of this
// any logged in sessions, any blog info in a session will need to be reset

// template keys, owners, lists of templates
// domain key, handle key
// client databases, etc...
// blog search engine keys
// blog entry keys
// rename /blogs/{id} directory
// rename /static/{id} file directory

var oldBlogID = process.argv[2];
var newBlogID = process.argv[3];

var keys = require("../redis/keys");
var async = require("async");
var client = require("../../app/models/client");

var User = require("../../app/models/user");
var Blog = require("../../app/models/blog");

if (require.main === module) {
  main(process.argv[2], process.argv[3], function(err) {
    if (err) throw err;
    console.log("Done!");
  });
}

function main(oldBlogID, newBlogID, callback) {
  Blog.get({ id: oldBlogID }, function(err, blog) {
    if (err) return callback(err);

    var multi = client.multi();

    multi.set("handle:" + blog.handle, newBlogID);

    // also set the www subdomain alternate key...
    if (blog.domain) multi.set("domain:" + blog.domain, newBlogID);

    multi.exec(function(err) {
      if (err) return callback(err);

      updateUser(blog.owner, oldBlogID, newBlogID, function(err) {
        if (err) return callback(err);

        renamePatterns(oldBlogID, newBlogID, function(err) {
          if (err) return callback(err);

          callback();
        });
      });
    });
  });
}

function renamePatterns(oldBlogID, newBlogID, callback) {
  var patterns = [
    "blog:" + oldBlogID + ":*",
    "template:" + oldBlogID + ":*",
    "template:owned_by:" + oldBlogID
  ];

  async.each(
    patterns,
    function(pattern, next) {
      keys(pattern, function(err, keys) {
        async.each(
          keys,
          function(key, next) {
            client.rename(
              key,
              key.split(":" + oldBlogID + ":").join(":" + newBlogID + ":"),
              next
            );
          },
          next
        );
      });
    },
    callback
  );
}

function updateUser(uid, oldBlogID, newBlogID, callback) {
  User.getById(uid, function(err, user) {
    if (err) return callback(err);
    user.blogs = user.blogs.filter(function(id) {
      return id !== oldBlogID;
    });

    user.blogs.push(newBlogID);

    User.set(user.uid, user, callback);
  });
}

// 'template:owned_by:' + blogID,
// 'handle:' + blog.handle,
// 'domain:' // also www version...
// "blog:" + blogID + ":dropbox:account";

// git client should just work

// Redis set whoses members are the blog IDs
// connected to this dropbox account.
// function blogsKey(account_id) {
//   return "clients:dropbox:" + account_id;
// }
