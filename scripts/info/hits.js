var moment = require("moment");
var lineReader = require("./util/linereader");
var numberWithCommas = require("./util/numberWithCommas");

if (require.main === module) {
  var range = process.argv[2] || "hours";
  var number = parseInt(process.argv[3]);

  if (isNaN(number)) {
    if (range === "hours") number = 24;
    if (range === "day") number = 1;
    if (range === "month") number = 1;
  }

  if (range !== "day" && range !== "month" && range !== "hours") {
    throw new Error("Only use day or month for range");
  }

  main({ range: range, number: number }, function(err, res) {
    console.log(
      res.averageResponseTime.toFixed(3) +
        "s average response time across " +
        numberWithCommas(res.hits) +
        " successful responses in previous " +
        number +
        " " +
        range +
        ", " +
        res.errors +
        " requests errored"
    );
  });
}
function main(options, callback) {
  var hits = 0;
  var responseTimes = [];
  var errors = 0;
  lineReader
    .eachLine(__dirname + "/../../logs/nginx.log", function(line, last) {
      // Last line of file is often empty
      if (!line) return true;

      if (line.indexOf("[error]") > -1) {
        errors++;
        return true;
      }

      if (line.indexOf("[warn]") > -1) {
        return true;
      }

      var date = moment(
        line.slice(1, line.indexOf("]")),
        "DD/MMM/YYYY:HH:mm:ss Z"
      );

      if (!date.isValid()) return;

      var components = line.slice(line.indexOf("]") + 2).split(" ");
      var status = parseInt(components[0]);
      var responseTime = parseFloat(components[1]);
      var serverName = components[2];
      var uri = components.slice(3).join(" ");

      // console.log(line);
      // console.log("  Date", date.format());
      // console.log("  Status:", status);
      // console.log("  Response time:", responseTime);
      // console.log("  Server name:", serverName);
      // console.log("  Url:", uri);

      if (date.isAfter(moment().subtract(options.number, options.range))) {
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

      responseTimes.forEach(function(responseTime) {
        sum += responseTime;
      });

      averageResponseTime = sum / responseTimes.length;

      callback(null, {
        averageResponseTime: averageResponseTime,
        hits: hits,
        errors: errors
      });
    });
}

module.exports = main;
