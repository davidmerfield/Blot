var moment = require("moment");
var lineReader = require("helper").lineReader;

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

    console.log(res.errors.join('\n'));
    console.log('--------------------------------------------------');
    console.log(
      res.errors.length +
        " requests errored out of " +
        res.hits +
        " total (" +
        ((res.errors.length / res.hits) * 100).toFixed(2) +
        "%) in previous " + number + " " + range
    );
  });
}
function main(options, callback) {
  var hits = 0;
  var errors = [];
  lineReader
    .eachLine(__dirname + "/../../logs/nginx.log", function(line, last) {
      // Last line of file is often empty
      if (!line) return true;

      if (line.indexOf("[error]") > -1) {
        errors.push(line);
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

      if (date.isAfter(moment().subtract(options.number, options.range))) {
        hits++;
        return true;
      } else {
        return false;
      }
    })
    .then(function() {
      callback(null, {
        hits: hits,
        errors: errors
      });
    });
}

module.exports = main;
