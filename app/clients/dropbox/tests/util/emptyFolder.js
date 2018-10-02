var Dropbox = require("dropbox");

module.exports = function(done) {
  var client = new Dropbox({
    accessToken: process.env.BLOT_DROPBOX_TEST_ACCOUNT_APP_TOKEN
  });

  client
    .filesListFolder({
      path: ""
    })
    .then(function(res) {
      console.log("Removing", res.entries.length, "items...");
      return client.filesDeleteBatch({
        entries: res.entries.map(function(entry) {
          return { path: entry.path_lower };
        })
      });
    })
    .then(function checkStatus(result) {
      return client.filesDeleteBatchCheck(result).then(function(res) {
        switch (res[".tag"]) {
          case "in_progress":
            return checkStatus(result);
          case "complete":
            return res;
          default:
            console.log("unknown response!", res);
            throw new Error("Unknow response", res);
        }
      })
    })
    .then(function(res) {
      console.log("Removed all files!");
      done();
    })
    .catch(function(err) {
      console.log(
        "Failed to empty folder:",
        err,
        err.error.error_summary,
        err.retry_after
      );
      done(new Error("Could not empty folder"));
    });
};
