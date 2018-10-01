var exec = require("child_process").exec;
var async = require('async');

module.exports = function(accountID, callback) {
  var base = "https://blot.development/clients/dropbox/webhook";
  
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
    base + "?full=true" +
    " --secret " +
    process.env.BLOT_DROPBOX_FULL_SECRET +
    " --account " +
    process.env.DROPBOX_TEST_ACCOUNT_ID;

  async.parallel(
    [exec.bind(this, appFolderCommand), exec.bind(this, fullFolderCommand)],
    callback
  );
};
