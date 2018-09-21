var REPO_DIR = __dirname + "/data";
var pushover = require("pushover");
var sync = require('./sync');
var repos = pushover(REPO_DIR, { autoCreate: true });

repos.on("push", function(push) {

  // console.log('here push', push.user);

  push.accept();

  push.response.once("finish", function() {
    sync(push.repo, function() {});
  });
});

module.exports = repos;