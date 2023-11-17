const fs = require("fs-extra");
const moment = require("moment");
const lineReader = require("helper/lineReader");
const prettyNumber = require("helper/prettyNumber");
const { blot_directory } = require("config");
const is = require("../../blog/render/retrieve/is");
const logDirectory = blot_directory + "/logs";

const LOGFILE = "app.log";

function loadTmpLogFile (callback) {
  const tmpLogFilePath =
    blot_directory + "/tmp/" + new Date().valueOf() + ".log";
  const todaysLogfile = logDirectory + "/" + LOGFILE;

  const yesterdaysLog = fs
    .readdirSync(logDirectory)
    .map(item => {
      return {
        name: item,
        has_app_logfiles: fs.existsSync(
          logDirectory + "/" + item + "/" + LOGFILE
        ),
        stat: fs.statSync(logDirectory + "/" + item)
      };
    })
    .filter(item => item.has_nginx)
    .sort((a, b) => {
      if (a.stat.mtime > b.stat.mtime) return 1;
      if (b.stat.mtime > a.stat.mtime) return -1;
      return 0;
    })
    .map(item => logDirectory + "/" + item.name + "/" + LOGFILE)
    .pop();

  if (yesterdaysLog) fs.copySync(yesterdaysLog, tmpLogFilePath);

  // open destination file for appending
  var w = fs.createWriteStream(tmpLogFilePath, { flags: "a" });

  // open source file for reading
  var r = fs.createReadStream(todaysLogfile);

  w.on("close", function () {
    callback(null, tmpLogFilePath);
  });

  r.pipe(w);
}

function main (callback) {
  loadTmpLogFile(function (err, tmpLogFilePath) {
    var hits = 0;
    var responseTimes = [];
    lineReader
      .eachLine(tmpLogFilePath, function (line) {
        // Last line of file is often empty
        if (!line) return true;

        if (line.indexOf("[error]") > -1) {
          return true;
        }

        if (line.indexOf("[warn]") > -1) {
          return true;
        }

        if (line[0] !== "[") return true;

        var date = moment(
          line.slice(1, line.indexOf("]")),
          "DD/MMM/YYYY:HH:mm:ss Z"
        );

        if (!date.isValid()) return true;

        // Ignore requests that are not from the last 24 hours
        if (!date.isAfter(moment().subtract(1, "day"))) return false;

        var components = line.slice(line.indexOf("]") + 2).split(" ");
        var statusCode = parseInt(components[1]);
        var responseTime = parseFloat(components[2]);
        var pid = parseInt(components[3].slice("PID=".length));

        // This line is not a request response
        if (isNaN(pid) || isNaN(statusCode) || isNaN(responseTime)) return true;

        hits++;
        responseTimes.push(responseTime);

        return true;
      })
      .then(function () {
        var averageResponseTime;
        var sum = 0;

        responseTimes.sort();

        responseTimes.forEach(function (responseTime) {
          sum += responseTime;
        });

        averageResponseTime = sum / responseTimes.length;

        fs.removeSync(tmpLogFilePath);

        callback(null, {
          average_response_time: prettyTime(averageResponseTime),
          median_response_time: prettyTime(
            responseTimes[Math.floor(responseTimes.length * 0.5)]
          ),
          ninety_ninth_percentile_response_time: prettyTime(
            responseTimes[Math.floor(responseTimes.length * 0.99)]
          ),
          total_requests_served: prettyNumber(hits)
        });
      });
  });
}

function prettyTime (n) {
  if (!n) return "";
  n = n.toFixed(2);
  if (n.toString() === "0.00") n = 0.01;
  return n + "s";
}

module.exports = main;

if (require.main === module) require("./cli")(main);
