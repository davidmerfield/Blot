const express = require("express");
const Stats = new express.Router();
const { admin, blot_directory } = require("config");
const lineReader = require("helper/lineReader");
const moment = require("moment");

// Ensure that only the admin can access this
Stats.use((req, res, next) => {
  if (!req.user || req.user.uid !== admin.uid) {
    return next(new Error("You are not authorized to access this page"));
  }

  next();
});

Stats.get("/stats.json", (req, res) => {
  const logFile = blot_directory + "/logs/app.log";
  const data = [];

  lineReader
    .eachLine(logFile, function (line) {
      try {
        const { date, responseTime } = parseLine(line);

        if (date && !isNaN(responseTime))
          data.push({ date, value: responseTime });

        if (data.length > 1000) return false;
      } catch (e) {}

      return true;
    })
    .then(function () {
      res.json([{ data, label: "response time" }]);
    });
});

function parseLine(line) {
  console.log("here", line);

  // Last line of file is often empty
  if (!line) return true;

  if (line.indexOf("[error]") > -1) {
    return true;
  }

  if (line.indexOf("[warn]") > -1) {
    return true;
  }

  if (line[0] !== "[") return true;

  var date = moment(line.slice(1, line.indexOf("]")), "DD/MMM/YYYY:HH:mm:ss Z");

  if (!date.isValid()) return true;

  var components = line.slice(line.indexOf("]") + 2).split(" ");
  var responseTime = parseFloat(components[2]);

  return { date, responseTime };
}

Stats.get("/", (req, res) => {
  res.render("stats");
});

module.exports = Stats;
