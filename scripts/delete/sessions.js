const keys = require("../db/keys");
const getConfirmation = require("../util/getConfirmation");
const client = require("client");

const KEYS_TO_DELETE = [];
keys(
  "sess:*",
  function (sessionKeys, next) {
    sessionKeys.forEach((key) => {
      if (key.indexOf("sess:") !== 0) throw new Error("Unexpected key: " + key);
      KEYS_TO_DELETE.push(key);
    });
    next();
  },
  function (err) {
    if (err) throw err;

    if (KEYS_TO_DELETE.length === 0) {
      console.log("No keys to delete");
      return process.exit();
    }

    console.log(KEYS_TO_DELETE);
    getConfirmation(`Delete ${KEYS_TO_DELETE.length} keys? (y/N)`, function (
      err,
      ok
    ) {
      if (!ok) {
        console.log("No keys deleted.");
        return process.exit();
      }

      console.log(`Deleting ${KEYS_TO_DELETE.length} keys...`);
      client.del(KEYS_TO_DELETE, function (err, stat) {
        if (err) throw err;
        console.log(`Deleted  ${stat} keys`);

        process.exit();
      });
    });
  }
);
