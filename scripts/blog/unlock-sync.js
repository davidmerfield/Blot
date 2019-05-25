var get = require("../get/blog");
var Redlock = require("redlock");
var client = require("client");
var sync = require("sync");

get(process.argv[2], function(err, user, blog) {
  if (err) throw err;

  var resource = "blog:" + blog.id + ":lock";
  var redlock = new Redlock([client]);


  client.get(resource, function(err, value) {
    var lock = new Redlock.Lock(redlock, resource, value, 1);
  
    console.log('Unlocking', resource, value);
  
    lock.unlock(function(err) {
      if (err) throw err;
      console.log("Unlocked", blog.id);
      sync(blog.id, function(err, folder, done) {
        if (err) throw err;
        done(null, function(err) {
          if (err) throw err;
          console.log('Successfully acquired and released sync for', blog.id);
          process.exit();
        });
      });
    });
  });
});
