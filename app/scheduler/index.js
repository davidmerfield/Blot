var User = require("models/user");
var async = require("async");
var dailyUpdate = require("./daily");
var email = require("helper/email");
var clfdate = require("helper/clfdate");
var schedule = require("node-schedule").scheduleJob;
var checkFeaturedSites = require("../documentation/featured/check");
var config = require("config");
var publishScheduledEntries = require("./publish-scheduled-entries");
const freeDiskSpace = require("./free-disk-space");
const os = require("os");
const fs = require("fs-extra");
const exec = require("child_process").exec;
const fix = require("sync/fix/all");
const zombies = require("./zombies");

// If any disk has less than 2GB of space, we should notify the admin
const MINIMUM_DISK_SPACE_IN_K = 2 * 1024 * 1024;

// If the data disk has less than 10GB of space, we should notify the admin
const DATA_DISK_MINIMUM_DISK_SPACE_IN_K = 10 * 1024 * 1024;

let NOTIFIED_LOW_DISK_SPACE = false;

module.exports = function () {
  // Log useful system information, once per minute
  schedule("* * * * *", function () {
    // Detect any zombie processes
    zombies(function (err) {
      if (err) throw err;
    });

    freeDiskSpace(function (err, disks) {
      let shouldNotify = false;

      if (err || !disks) {
        console.error(clfdate(), "Error checking disk space", err);
        return;
      }

      console.log(
        clfdate(),
        "[STATS]",
        "Available disk space",
        disks.map(disk => disk.label + "=" + disk.available_human).join(", ")
      );

      if (disks.some(disk => disk.available_k < MINIMUM_DISK_SPACE_IN_K)) {
        shouldNotify = true;
      }

      if (
        disks.find(disk => disk.label === "data") &&
        disks.find(disk => disk.label === "data").available_k <
          DATA_DISK_MINIMUM_DISK_SPACE_IN_K
      ) {
        shouldNotify = true;
      }

      if (shouldNotify && !NOTIFIED_LOW_DISK_SPACE) {
        NOTIFIED_LOW_DISK_SPACE = true;
        email.WARNING_LOW_DISK_SPACE(null, { disks }, function (err) {
          if (err) console.log(clfdate(), err);
        });
      }
    });

    // Print most memory-intensive processes
    exec(
      "ps -eo pmem,pcpu,comm,args | sort -k 1 -nr | head -10",
      function (err, stdout) {
        if (err || !stdout) return;

        if (config.environment === "development") {
          // this is annoying in development
        } else {
          console.log(clfdate(), "[STATS]", "top");
          console.log(stdout);
        }
      }
    );

    // Print cpu and memory information
    fs.readFile("/proc/meminfo", "utf-8", function (err, contents) {
      // This won't work on MacOS
      if (err || !contents) return;

      let stats = {};

      contents
        .trim()
        .split("\n")
        .forEach(line => {
          stats[line.split(":")[0].trim()] = parseInt(
            line.split(":")[1].trim()
          );
        });

      let loadavg = os.loadavg()[0];
      let totalCPUs = os.cpus().length;
      let totalmem = stats.MemTotal;
      let freemem = stats.MemAvailable;
      let pretty = num => (100 * num).toFixed(3) + "%";

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

  console.log(clfdate(), "Scheduled daily check of storage disk usage");
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
    });
  });

  console.log(
    clfdate(),
    "Scheduled daily check of folders for sync abnormalities"
  );
  schedule({ hour: 8, minute: 0 }, function () {
    console.log(clfdate(), "Fix sync: checking folders");
    fix(function (err, report) {
      if (err) {
        console.log(clfdate(), "Fix sync: error checking folders", err);
      } else {
        email.SYNC_REPORT(null, { report: JSON.stringify(report) });
        console.log(clfdate(), "Fix sync: checked all folders");
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
  console.log(clfdate(), "Scheduled daily update email");
  schedule({ hour: 12, minute: 0 }, function () {
    console.log(clfdate(), "Generating daily update email...");
    dailyUpdate(function () {
      console.log(clfdate(), "Daily update email update was sent.");
    });
  });
};
