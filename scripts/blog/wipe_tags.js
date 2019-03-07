var get = require("./get");
var client = require("redis").createClient();
var yesno = require("yesno");

var START_CURSOR = "0";

get(process.argv[2], function(user, blog) {
  var pattern = "blog:" + blog.id + ":tags:*";
  var args = [START_CURSOR, "MATCH", pattern, "COUNT", 1000];
  var remove = [];

  client.scan(args, function then(err, res) {
    if (err) throw err;

    // the cursor for the next pass
    args[0] = res[0];

    // Append the keys we matched in the last pass
    remove = remove.concat(res[1]);

    // There are more keys to check, so keep going
    if (res[0] !== START_CURSOR) return client.scan(args, then);

    if (!remove.length) {
      console.log("No keys found matching pattern", pattern);
      return process.exit();
    }

    console.log(remove);

    yesno.ask("Remove " + remove.length + " keys?", false, function(yes) {
      if (!yes) throw new Error("\nDid not apply changes");

      client.del(remove, function(err, stat) {
        if (err) throw err;
        console.log(stat, "removed", remove.length, "keys");
        process.exit();
      });
    });
  });
});
