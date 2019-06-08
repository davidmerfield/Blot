var moment = require("moment");
var helper = require("helper");
var lineReader = helper.lineReader;
var numberWithCommas = helper.prettyNumber;

function main(callback) {
  var hits = 0;
  var responseTimes = [];
  lineReader
    .eachLine(helper.rootDir + "/logs/nginx.log", function(line, last) {
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
      var status = parseInt(components[0]);
      var responseTime = parseFloat(components[1]);
      var serverName = components[2];
      var uri = components.slice(3).join(" ");

      if (date.isAfter(moment().subtract(1, 'day'))) {
        hits++;
        responseTimes.push(responseTime);
        return true;
      } else {
        // older than a day
        return false;
      }
    })
    .then(function() {
      var averageResponseTime;
      var sum = 0;

      responseTimes.sort();

      responseTimes.forEach(function(responseTime) {
        sum += responseTime;
      });

      averageResponseTime = sum / responseTimes.length;

      callback(null, {
        average_response_time: prettyTime(averageResponseTime),
        median_response_time: prettyTime(responseTimes[Math.floor(responseTimes.length * 0.5)]),
        ninety_ninth_percentile_response_time:
          prettyTime(responseTimes[Math.floor(responseTimes.length * 0.99)]),
        total_requests_served: require('helper').prettyNumber(hits)
      });
    });
}

function prettyTime (n) {
  if (!n) return '';
  n = n.toFixed(2);
  if (n.toString() === '0.00') n = 0.01;
  return n + 's';
}

module.exports = main;

if (require.main === module) require("./cli")(main);
