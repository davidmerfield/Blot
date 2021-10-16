var User = require("user");
var async = require("async");
var backup = require("./backup");
var dailyUpdate = require("./daily");
var email = require("helper/email");
var clfdate = require("helper/clfdate");
var warmCache = require("./warmCache");
var schedule = require("node-schedule").scheduleJob;
var checkFeaturedSites = require("../brochure/routes/featured/check");
var config = require("config");
var publishScheduledEntries = require("./publish-scheduled-entries");
const os = require("os");
const fs = require("fs-extra");
const exec = require("child_process").exec;

module.exports = function () {
  // Log useful system information, once per minute
  schedule("* * * * *", function () {
    // Print most memory-intensive processes
    exec("ps -eo pmem,pcpu,comm,args | sort -k 1 -nr | head -10", function (
      err,
      stdout
    ) {
      if (err || !stdout) return;

      if (config.environment === "development") {
        // this is annoying in development
      } else {
        console.log(clfdate(), "[STATS]", "top");
        console.log(stdout);
      }
    });

    // Print cpu and memory information
    fs.readFile("/proc/meminfo", "utf-8", function (err, contents) {
      // This won't work on MacOS
      if (err || !contents) return;

      let stats = {};

      contents
        .trim()
        .split("\n")
        .forEach((line) => {
          stats[line.split(":")[0].trim()] = parseInt(
            line.split(":")[1].trim()
          );
        });

      let loadavg = os.loadavg()[0];
      let totalCPUs = os.cpus().length;
      let totalmem = stats.MemTotal;
      let freemem = stats.MemAvailable;
      let pretty = (num) => (100 * num).toFixed(3) + "%";

      console.log(
        clfdate(),
        "[STATS]",
        "cpuuse=" + pretty(loadavg / totalCPUs),
        "memuse=" + pretty((totalmem - freemem) / totalmem)
      );
    });
  });

  // Bash the cache for scheduled posts
  publishScheduledEntries(function (err) {
    if (err) throw err;
    console.log(clfdate(), "Scheduled entries for future publication");
  });

  // Warm the cache for the brochure site
  warmCache(function (err) {
    if (err) throw err;
  });

  // Warn users about impending subscriptions
  User.getAllIds(function (err, uids) {
    async.each(uids, User.scheduleSubscriptionEmail, function (err) {
      if (err) {
        console.error("Error scheduling subscription emails:", err);
      } else {
        console.log(clfdate(), "Scheduled emails for renewals and expiries!");
      }
    });
  });

  console.log(
    clfdate(),
    "Scheduled daily check of storage disk usage for 6am!"
  );
  schedule({ hour: 10, minute: 0 }, function () {
    console.log(clfdate(), "Scheduler: Checking available disk space");

    exec("df -h", function (err, stdout) {
      if (err) throw err;

      var disk = stdout.split("\n")[1].replace(/\s+/g, " ").split(" ");
      var usage = disk[4];
      var available = disk[3];

      if (parseInt(usage) < 90) {
        console.log(
          clfdate(),
          "Scheduler: Disk usage check passed! Usage:",
          usage,
          "Space available:",
          available
        );
        return;
      }

      console.log(
        clfdate(),
        "Scheduler: Disk usage check failed! Usage:",
        usage,
        "Space available:",
        available
      );

      email.WARNING_LOW_DISK_SPACE(
        null,
        { usage: usage, available: available },
        function (err) {
          if (err) console.log(clfdate(), err);
        }
      );
    });
  });

  console.log(clfdate(), "Scheduled daily backups for 3am!");
  schedule({ hour: 11, minute: 0 }, function () {
    // Start the backup daemon
    console.log(clfdate(), "Backup: Starting backup");
    backup(function (err) {
      if (err) {
        console.log(clfdate(), "Backup: Error:" + err);
      } else {
        console.log(clfdate(), "Backup: Successfully backed up");
      }
    });
  });

  console.log(clfdate(), "Scheduled daily check of featured sites");
  schedule({ hour: 8, minute: 0 }, function () {
    console.log(clfdate(), "Checking featured sites");
    checkFeaturedSites(function (err) {
      if (err) {
        console.log(clfdate(), "Error: Checking featured sites", err);
      } else {
        console.log(clfdate(), "Checked featured sites");
      }
    });
  });

  // At some point I should check this doesnt consume too much memory
  console.log(clfdate(), "Scheduled daily update email for 6:05am!");
  schedule({ hour: 10, minute: 5 }, function () {
    console.log(clfdate(), "Generating daily update email...");
    dailyUpdate(function () {
      console.log(clfdate(), "Daily update email update was sent.");
    });
  });
};
