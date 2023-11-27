var client = require("redis").createClient();
var multi = client.multi();
var keysToDelete = [];
var yesno = require("yesno");
var Keys = require("./keys");

Keys(
  "*",
  function (keys, next) {
    keysToDelete = keysToDelete.concat(
      keys.filter(function (key) {
        return key.indexOf("cache:") === 0;
      })
    );
    next();
  },
  function (err) {
    if (err) throw err;
    if (!keysToDelete.length) {
      console.log("No keys to delete");
      process.exit();
    }
    console.log(JSON.stringify(keysToDelete, null, 2));
    yesno.ask(
      "Delete " + keysToDelete.length + " keys? (y/n)",
      false,
      function (ok) {
        if (!ok) return process.exit();
        multi.del(keysToDelete);
        multi.exec(function (err) {
          if (err) throw err;
          console.log("Deleted " + keysToDelete.length + " keys");
          process.exit();
        });
      }
    );
  }
);
