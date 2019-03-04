var moment = require("moment");
var lineReader = require("./util/linereader");
var hits = 0;
lineReader
  .eachLine(__dirname + "/../../logs/nginx.log", function(line, last) {
    if (line.indexOf("[error]") > -1 || line.indexOf("[warn]") > -1) return;

    var date = line.slice(1, "25/Jul/2018:17:34:58 -0400".length + 1);

    date = moment(date, "DD/MMM/YYYY:HH:mm:ss Z");

    if (!date.isValid()) return;

    if (date.isAfter(moment().subtract(1, "day"))) {
      hits++;
      return true;
    } else {
      // older than a day
      return false;
    }
  })
  .then(function() {
    console.log(hits + ' hits in the last day');
  });
