const fs = require("fs-extra");
var moment = require("moment");
var lineReader = require("helper/lineReader");
const rootDir = require("helper/rootDir");
const prettyNumber = require("helper/prettyNumber");
const logDirectory = rootDir + "/logs";

function loadTmpLogFile(callback) {
  const tmpLogFilePath = rootDir + "/tmp/" + new Date().valueOf() + ".log";
  const yesterdaysLog = fs
    .readdirSync(logDirectory)
    .map((item) => {
      return {
        name: item,
        has_nginx: fs.existsSync(logDirectory + "/" + item + "/nginx.log"),
        stat: fs.statSync(logDirectory + "/" + item),
      };
    })
    .filter((item) => item.has_nginx)
    .sort((a, b) => {
      if (a.stat.mtime > b.stat.mtime) return 1;
      if (b.stat.mtime > a.stat.mtime) return -1;
      return 0;
    })
    .map((item) => logDirectory + "/" + item.name + "/nginx.log")
    .pop();

  if (yesterdaysLog) fs.copySync(yesterdaysLog, tmpLogFilePath);

  // open destination file for appending
  var w = fs.createWriteStream(tmpLogFilePath, { flags: "a" });
  // open source file for reading
  var r = fs.createReadStream(logDirectory + "/nginx.log");

  w.on("close", function () {
    callback(null, tmpLogFilePath);
  });

  r.pipe(w);
}
function main(callback) {
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

        var components = line.slice(line.indexOf("]") + 2).split(" ");
        var responseTime = parseFloat(components[2]);

        if (date.isAfter(moment().subtract(1, "day"))) {
          if (!isNaN(responseTime)) {
            hits++;
            responseTimes.push(responseTime);
          }
          return true;
        } else {
          // older than a day
          return false;
        }
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
          total_requests_served: prettyNumber(hits),
        });
      });
  });
}

function prettyTime(n) {
  if (!n) return "";
  n = n.toFixed(2);
  if (n.toString() === "0.00") n = 0.01;
  return n + "s";
}

module.exports = main;

if (require.main === module) require("./cli")(main);
