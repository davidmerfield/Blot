const client = require("redis").createClient();
const multi = client.multi();
const yesno = require("yesno");
const Keys = require("./keys");

const keysToDelete = [];

Keys("blog:*:search:*", handle, done);

function handle(keys, next) {
  if (keysToDelete.length > 100 && process.argv[2] !== "-f") return done();

  keys
    // we need to perform this filtering because
    // the pattern will match some keys incorrectly
    // since the * will include ':', e.g.
    // blog:123:entry:search.txt <- should not be deleted
    // but will appear in the list of keys
    .filter(function (key) {
      const blogID = key.split(":")[1];
      return key.startsWith(`blog:${blogID}:search:`);
    })
    .forEach((key) => keysToDelete.push(key));

  next();
}

function done(err) {
  if (err) throw err;
  if (!keysToDelete.length) {
    console.log("No keys to delete");
    process.exit();
  }
  if (process.argv[2] !== "-f")
    console.log(JSON.stringify(keysToDelete, null, 2));
  yesno.ask("Delete " + keysToDelete.length + " keys? (y/n)", false, function (
    ok
  ) {
    if (!ok) return process.exit();
    multi.del(keysToDelete);
    multi.exec(function (err) {
      if (err) throw err;
      console.log("Deleted " + keysToDelete.length + " keys");
      process.exit();
    });
  });
}
