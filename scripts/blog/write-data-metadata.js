var Entry = require("entry");
var Entries = require("entries");
var Blog = require("blog");
var get = require("../get/blog");
var each = require("../each/entry");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;
  Entries.each(
    blog.id,
    function(entry, next) {
      if (entry.metadata.date) {
        return next();
      }
      
      if ()
    },
    function() {
      console.log("Done!");
      process.exit();
    }
  );
});
