const moment = require("moment");
const lineReader = require("helper/lineReader");
const prettyNumber = require("helper/prettyNumber");
const rootDir = require("helper/rootDir");
const LOG = rootDir + "/logs/nginx.log";

function main(callback) {
  var hits = 0;
  var responseTimes = [];
  const onLine = (line) => {
    if (
      !line ||
      line.indexOf("[warn]") > -1 ||
      line.indexOf("[error]") > -1 ||
      line[0] !== "["
    )
      return true;

    let datestring = line.slice(1, line.indexOf("]"));
    let date = moment(datestring, "DD/MMM/YYYY:HH:mm:ss Z");

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
  };

  lineReader.eachLine(LOG, onLine).then(function () {
    var averageResponseTime;
    var sum = 0;

    responseTimes.sort();

    responseTimes.forEach(function (responseTime) {
      sum += responseTime;
    });

    averageResponseTime = sum / responseTimes.length;

    callback(null, {
      average_response_time: prettyTime(averageResponseTime),
      total_requests_served: prettyNumber(hits),
      requests_per_second: hits / 60,
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
