var moment = require("moment");
var lineReader = require("./util/linereader");

function main(options, callback) {
  var responseTimes = [];
  lineReader
    .eachLine(__dirname + "/../../logs/nginx.log", function (line, last) {
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
      var uri = components.slice(-1);

      // console.log(line);
      // console.log("  Date", date.format());
      // console.log("  Status:", status);
      // console.log("  Response time:", responseTime);
      // console.log("  Server name:", serverName);
      // console.log("  Url:", uri);

      if (date.isAfter(moment().subtract(options.number, options.range))) {
        responseTimes.push({ responseTime: responseTime, uri: uri });
        return true;
      } else {
        // older than a day
        return false;
      }
    })
    .then(function () {
      responseTimes.sort(function (a, b) {
        return a.responseTime > b.responseTime
          ? -1
          : b.responseTime > a.responseTime
          ? 1
          : 0;
      });

      responseTimes = responseTimes.slice(0, 100);

      callback(null, {
        responseTimes,
      });
    });
}

module.exports = main;

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

  main({ range: range, number: number }, function (err, res) {
    console.log(
      "URIs with the slowest request_time in the previous " +
        number +
        " " +
        range +
        ":"
    );
    res.responseTimes.reverse().forEach(function (item, i) {
      console.log(item.responseTime.toFixed(3) + "s " + item.uri);
    });

    console.log();
    console.log(
      "Pass a unit (hours/day/month) as first argument and a size (e.g. 24) as second argument to view information for different periods."
    );
  });
}
