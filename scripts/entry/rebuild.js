var get = require("../get/entry");
var sync = require("../../app/sync");

get(process.argv[2], function(err, user, blog, entry) {
  if (err) throw err;
  sync(blog.id, function(err, folder, done) {
    if (err) throw err;
    folder.update(entry.path, function(err) {
      if (err) throw err;
      done(null, function(err) {
        if (err) throw err;
      });
    });
  });
});
