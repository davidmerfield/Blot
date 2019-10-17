console.log(new Date(), "Starting status page");

var fs = require("fs");
var request = require("request");
var moment = require("moment");
var hogan = require("hogan.js");
var async = require("async");
var config = require("./config");
var services = config.services;

// Set up the database to store status
// and uptime logs for each service.
var db = require("lowdb")("db.json");
var init = {};

for (var id in services) init[id] = [];

// Make a directory to contain the backed
// up database if none exists.
try {
  fs.mkdirSync("backups");
} catch (e) {}

db.defaults(init).write();

var MAX_BACKUPS = 30; // 30 days of backups
var BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hr
var PING_INTERVAL = 60 * 1000; // 1 minute

// Periodically request the health endpoint
// for each service and store the response
setInterval(function() {
  async.eachOfSeries(
    services,
    function(url, name, next) {
      var datestamp = Date.now();
      var duration, response;
      var options = {
        url: url,
        timeout: 15000
      };

      request(options, function(err, res) {
        // we need to retry this request
        // since it didn't make it out
        // of this machine to Blot's server
        if (err && err.connect === false) {
          console.log(new Date(), "Error making request to", url, err);
          return next();
        }

        duration = Date.now() - datestamp;
        response = [datestamp, duration];

        if (res && res.statusCode && res.statusCode !== 200)
          response.push(res.statusCode);

        if (err || !res || !res.statusCode) response.push(err || "No response");

        db.get(name)
          .push(response)
          .write();

        next();
      });
    },
    render
  );
}, PING_INTERVAL);

// Periodically back up the dump file just in
// case. We don't want to lose the info.
setInterval(function() {
  console.log(new Date(), "Backing up database file");
  db.write("backups/" + Date.now() + ".json");
  console.log(new Date(), "Back up complete");

  console.log(new Date(), "Removing old backup files");
  fs.readdir("backups", function(err, contents) {
    // Ignore any files that are not db dumps.
    contents = contents.filter(function(a) {
      return a[0] !== "." && a.indexOf(".json") > -1;
    });

    // Only store the previous 30 backups
    if (contents.length < MAX_BACKUPS) return;

    // Sort them by name
    contents = contents.sort();

    var remove = contents.slice(0, -1 * MAX_BACKUPS);

    remove.map(function(name) {
      fs.unlink(__dirname + "/backups/" + name, function(err) {});
    });
  });
}, BACKUP_INTERVAL);

var INDEX = "";
var SOURCE = fs.readFileSync("index.html", "utf-8");

render();

function render() {
  var statuses = db
    .get("site")
    .value()
    .slice();
  var percent =
    statuses.filter(function(a) {
      return a[2] === undefined;
    }).length / statuses.length;

  percent = percent * 100;
  percent = percent.toFixed(2);

  if (percent - 100 === 0) percent = 99.99;

  percent = percent + "%";

  if (!statuses.length) return;

  var latestStatus = statuses.pop();
  var up = latestStatus[2] === undefined;

  if (!statuses.length) return;

  var firstStatus = statuses.shift();
  var ago = moment.utc(firstStatus[0]).fromNow();

  var template = hogan.compile(SOURCE);
  var date = moment.utc(latestStatus[0]).format("MMMM Do YYYY, h:mmA [UTC]");

  INDEX = template.render({
    homepage: "https://blot.im",
    date: date,
    up: up,
    percent: percent,
    ago: ago
  });
}

// Now we set up a web server to render
// the uptime & status info to readers.
var express = require("express");
var server = express();

server

  .get("/favicon.png", function(req, res) {
    res.sendFile(__dirname + "/favicon.png");
  })

  .get("/", function(req, res) {
    res.send(INDEX);
  })

  .use(function(req, res) {
    res.redirect("/");
  })

  .use(function(err, req, res, next) {
    res.send(":(");
  })

  .listen(config.port);

console.log(new Date(), "Listening for requests on port", config.port);
