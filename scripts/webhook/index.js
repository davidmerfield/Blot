require("../only_locally");

var exec = require("child_process").exec;

var config = require("config");
var account_id = "dbid:AAAsD4hYhV-hwl7Ti2jbK24ExD2EakNgyow";

var options = require("minimist")(process.argv.slice(2));

var url = "https://blot.development/clients/dropbox/webhook";
var secret;

if (options.f) {
  url += "?full=true";
  secret = config.dropbox.full.secret;
} else {
  url = "https://blot.development/clients/dropbox/webhook";
  secret = config.dropbox.app.secret;
}

var command =
  "python scripts/webhook/dropbox_hook.py notify " +
  url +
  " --secret " +
  secret +
  " --account " +
  account_id;

if (options.c) {
  var interval = parseFloat(options.c) || 5;

  console.log("Calling webhook every " + interval + " seconds...");
  webhook(function(err) {
    if (err) throw err;
  });
  setInterval(function() {
    webhook(function(err) {
      if (err) throw err;
    });
  }, interval * 1000);
} else if (options.s) {
  swarm();
} else {
  webhook(function(err) {
    if (err) throw err;
    process.exit();
  });
}

function webhook(callback) {
  console.log("Calling webhook...");
  exec(command, function(err, stdout) {
    if (err) return callback(err);
    console.log(stdout.trim());
    callback(null);
  });
}
function swarm() {
  var count = Math.round(Math.random() * 2) + 2;

  console.log("Herd of", count, "webhooks");

  while (count > 0) {
    webhook(function(err) {
      if (err) throw err;
    });
    count--;
  }

  var delay = Math.floor(Math.random() * 3000);

  if (options.o === undefined) setTimeout(swarm, delay);
}
