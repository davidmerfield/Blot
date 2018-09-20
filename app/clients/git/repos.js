var REPO_DIR = __dirname + "/data";
var pushover = require("pushover");
var repos = pushover(REPO_DIR, { autoCreate: true });
var sync = require('./sync');

repos.on("push", function(push) {
  push.accept();

  push.response.once("finish", function() {
    sync(push.repo, function() {});
  });
});

module.exports = repos;