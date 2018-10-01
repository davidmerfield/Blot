var exec = require("child_process").exec;
var async = require("async");

module.exports = function(port) {
  return function(callback) {
    var base = "http://localhost:" + port + "/clients/dropbox/webhook";

    var appFolderCommand =
      "python " +
      __dirname +
      "/dropbox_hook.py notify " +
      base +
      " --secret " +
      process.env.BLOT_DROPBOX_APP_SECRET +
      " --account " +
      process.env.BLOT_DROPBOX_TEST_ACCOUNT_ID;

    var fullFolderCommand =
      "python " +
      __dirname +
      "/dropbox_hook.py notify " +
      base +
      "?full=true" +
      " --secret " +
      process.env.BLOT_DROPBOX_FULL_SECRET +
      " --account " +
      process.env.BLOT_DROPBOX_TEST_ACCOUNT_ID;

    exec(appFolderCommand, function(err, stdout, stderr) {

      if (err) return callback(new Error("Webhook failed"));

      callback();
    });
  };
};
