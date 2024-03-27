const client = require("redis").createClient();
const Keys = require("./keys");

let totalDeleted = 0;

Keys("blot:questions:*", handle, done);

function handle (keys, next) {
  const keysToDelete = [];

  keys
    // we need to perform this filtering because
    // the pattern will match some keys incorrectly
    // since the * will include ':', e.g.
    // blog:123:entry:search.txt <- should not be deleted
    // but will appear in the list of keys
    .filter(function (key) {
      return key.startsWith(`blot:questions:`);
    })
    .forEach(key => keysToDelete.push(key));

  if (!keysToDelete.length) return next();

  client.del(keysToDelete, function (err, stat) {
    if (err) throw err;
    totalDeleted += stat;
    console.log("Deleted " + stat + " keys");
    next();
  });
}

function done (err) {
  if (err) {
    throw err;
  }

  console.log("Deleted " + totalDeleted + " keys in total");
  process.exit();
}
