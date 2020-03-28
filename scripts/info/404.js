var config = require("config");
var moment = require("moment");
var lineReader = require("helper").lineReader;

// Exec remote something like this:
// tail logs/nginx.log -n 1000000 | grep " 404 " | grep "https://blot.im" | grep -v "https://blot.im/cdn/"

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
    if (err) throw err;

    console.log(res);
    console.log();
    console.log(
      "Pass a unit (hours/day/month) as first argument and a size (e.g. 24) as second argument to view information for different periods."
    );
  });
}
function main(options, callback) {
  var four04s = [];
  lineReader
    .eachLine(__dirname + "/../../logs/nginx.log", function(line, last) {
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
      var serverName = components[3];
      var uri = components
        .slice(3)
        .join(" ")
        .split(" ")[1];

      // console.log(line);
      // console.log("  Date", date.format());
      // console.log("  Status:", status);
      // console.log("  Response time:", responseTime);
      // console.log("  Server name:", serverName);
      // console.log("  Url:", uri);

      // older than a day
      if (date.isAfter(moment().subtract(options.number, options.range))) {
        if (
          status === 404 &&
          require("url").parse(uri).hostname === config.host
        ) {
          if (
            require("url")
              .parse(uri)
              .pathname.indexOf("/static") === 0
          ) {
            // refers to a file in the user's folder server by s3
          } else {
            four04s.push(uri);
          }
        }

        return true;
      } else {
        return false;
      }
    })
    .then(function() {
      callback(null, {
        four04s: four04s
      });
    });
}

module.exports = main;
