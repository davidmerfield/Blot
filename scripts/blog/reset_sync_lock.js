var get = require('./get');
var reset_sync_lock = require('../../app/sync/lease').reset;

get(process.argv[2], function(user, blog){

  if (!blog || !blog.id) throw 'no blog';

  reset_sync_lock(blog.id, function(err){

    if (err) throw err;

    console.log("Reset sync lock for", blog.title, blog.id);
    process.exit();
  });
});