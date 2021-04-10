var redis = require("redis").createClient(),
  _ = require("lodash"),
  Blog = require("models/blog");

var handle = process.argv[2];

if (!handle) throw "Please pass the blog's handle as an argument.";

console.log("Reseting entries for " + handle);

Blog.get({ handle: handle }, function (error, blog) {
  console.log(blog.menu);

  console.log();

  var newMenu =
    _.filter(blog.menu, function (link) {
      return ("" + link.id).length > 10;
    }) || [];

  var blogID = blog.id;

  Blog.set(blogID, { menu: newMenu }, function () {});

  if (!blog) throw "There is no blog with the handle " + handle;

  redis.keys("blog:" + blogID + ":public:*", function (error, entryKeys) {
    entryKeys.forEach(function (entryKey) {
      console.log("Deleting: " + entryKey);

      redis.del(entryKey);

      // var entryID = parseInt(entryKey.slice(('blog:' + blogID + ':entry:').length));

      // Entry.getByID(blogID, entryID, function(entry){});
    });
  });

  redis.keys("blog:" + blogID + ":tag:*", function (error, entryKeys) {
    entryKeys.forEach(function (entryKey) {
      console.log("Deleting: " + entryKey);

      redis.del(entryKey);

      // var entryID = parseInt(entryKey.slice(('blog:' + blogID + ':entry:').length));

      // Entry.getByID(blogID, entryID, function(entry){});
    });
  });

  redis.keys("blog:" + blogID + ":search:*", function (error, entryKeys) {
    entryKeys.forEach(function (entryKey) {
      console.log("Deleting: " + entryKey);

      redis.del(entryKey);

      // var entryID = parseInt(entryKey.slice(('blog:' + blogID + ':entry:').length));

      // Entry.getByID(blogID, entryID, function(entry){});
    });
  });

  redis.keys("blog:" + blogID + ":entry:*", function (error, entryKeys) {
    entryKeys.forEach(function (entryKey) {
      console.log("Deleting: " + entryKey);

      redis.del(entryKey);

      // var entryID = parseInt(entryKey.slice(('blog:' + blogID + ':entry:').length));

      // Entry.getByID(blogID, entryID, function(entry){});
    });
  });

  redis.keys("blog:" + blogID + ":path:*", function (error, pathKeys) {
    pathKeys.forEach(function (pathKey) {
      console.log("Deleting: " + pathKey);
      redis.del(pathKey);
    });
  });

  redis.keys("blog:" + blogID + ":url:*", function (error, urlKeys) {
    urlKeys.forEach(function (urlKey) {
      console.log("Deleted url key: " + urlKey);
      redis.del(urlKey);
    });
  });

  redis.del("blog:" + blogID + ":pages");
  redis.del("blog:" + blogID + ":drafts");
  redis.del("blog:" + blogID + ":deleted");
  redis.del("blog:" + blogID + ":scheduled");
  redis.del("blog:" + blogID + ":tags");
  redis.del("blog:" + blogID + ":entries");
  redis.del("blog:" + blogID + ":recent_entries");
  redis.del("blog:" + blogID + ":next_entry_id");
  redis.del("blog:" + blogID + ":ignored_files");
});
