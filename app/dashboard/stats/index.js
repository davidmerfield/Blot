const express = require("express");
const Stats = new express.Router();
const { admin, blot_directory } = require("config");
const lineReader = require("helper/lineReader");
const moment = require("moment");
const URL = require("url");

// Ensure that only the admin can access this
Stats.use((req, res, next) => {
  if (!req.user || req.user.uid !== admin.uid) {
    return next(new Error("You are not authorized to access this page"));
  }

  next();
});

Stats.get("/stats.json", async (req, res) => {
  const logFile = blot_directory + "/logs/app.log";
  const data = await loadData(logFile);

  // we want to calculate the average response time per minute
  // so we need to group the data by minute then calculate the average
  const groupedData = data.reduce((acc, request) => {
    const key = request.date.format("YYYY-MM-DD-HH-mm");

    if (!acc[key]) {
      console.log("here", key);
      acc[key] = [];
    }

    acc[key].push(request);

    return acc;
  }, {});

  const averageResponseTime = Object.keys(groupedData).map((key) => {
    const values = groupedData[key];
    const average =
      values.reduce((acc, { responseTime }) => acc + responseTime, 0) /
      values.length;

    return [moment(key, "YYYY-MM-DD-HH-mm").valueOf(), average * 1000 ];
  });

  const fractionOf2XXRequests = Object.keys(groupedData).map((key) => {
    const values = groupedData[key];
    const total = values.length;
    const fraction = values.reduce((acc, { status }) => {
      if (status >= 200 && status < 300) return acc + 1;
      return acc;
    }, 0);

    return [moment(key, "YYYY-MM-DD-HH-mm").valueOf(), fraction / total];
  });

  const fractionOf4XXRequests = Object.keys(groupedData).map((key) => {
    const values = groupedData[key];
    const total = values.length;
    const fraction = values.reduce((acc, { status }) => {
      if (status >= 400 && status < 500) return acc + 1;
      return acc;
    }, 0);

    return [moment(key, "YYYY-MM-DD-HH-mm").valueOf(), fraction / total];
  });

  const fractionOf5XXRequests = Object.keys(groupedData).map((key) => {
    const values = groupedData[key];
    const total = values.length;
    const fraction = values.reduce((acc, { status }) => {
      if (status >= 500 && status < 600) return acc + 1;
      return acc;
    }, 0);

    return [moment(key, "YYYY-MM-DD-HH-mm").valueOf(), fraction / total];
  });

  const numberOfRequestsPerMinute = Object.keys(groupedData).map((key) => {
    const values = groupedData[key];

    return [moment(key, "YYYY-MM-DD-HH-mm").valueOf(), values.length];
  });

  res.json([
    { data: averageResponseTime, label: "average response time MS" },
    { data: numberOfRequestsPerMinute, label: "number of requests" },
    {
      data: [
        fractionOf4XXRequests,
        fractionOf5XXRequests,
      ],
      legend: ['4XX', '5XX'],

      label: "error rates",
    },
  ]);
});

function loadData(logFile) {
  const data = [];
  return new Promise((resolve, reject) => {
    lineReader
      .eachLine(logFile, function (line) {
        try {
          const parsed = parseLine(line);

          if (parsed.date && !isNaN(parsed.responseTime)) {
            data.push(parsed);
          }

          if (data.length > 5000) return false;
        } catch (e) {}

        return true;
      })
      .then(function () {
        resolve(data);
      });
  });
}

function parseLine(line) {

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
  var status = parseFloat(components[1]);
  var workerPID = components[3].slice("PID=".length);
  var url = components[4];
  var host = URL.parse(components[4]).hostname;

  return { date, responseTime, status, workerPID, url, host };
}

Stats.get("/", (req, res) => {
  res.render("stats");
});

module.exports = Stats;
