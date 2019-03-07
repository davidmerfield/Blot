var get = require("../get/blog");
var sync = require("../../app/sync");

if (!process.argv[2]) {
  console.log(
    "Please pass a URL to a source file as the first and only argument to this script. Blot will build an entry which exists at that URL."
  );
  process.exit();
}

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;
  sync(blog.id, function(err, folder, done) {
    if (err) throw err;
    
    var url = require('url').parse(process.argv[2]);
    var path = decodeURIComponent(url.path);

    folder.update(path, function(err) {
      if (err) throw err;
      done(null, function(err) {
        if (err) throw err;
        console.log('Rebuilt:', path, 'for', blog.handle);
        process.exit();
      });
    });
  });
});
