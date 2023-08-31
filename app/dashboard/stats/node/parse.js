const moment = require("moment");
const URL = require("url");

module.exports = function parseNodeLogLine (line) {
  // Last line of file is often empty
  if (!line) throw new Error("Empty line");

  if (line.indexOf("[error]") > -1) throw new Error("Error line");

  if (line.indexOf("[warn]") > -1) throw new Error("Warn line");

  if (line[0] !== "[") throw new Error("Invalid line");

  var date = moment(line.slice(1, line.indexOf("]")), "DD/MMM/YYYY:HH:mm:ss Z");

  if (!date.isValid()) throw new Error("Invalid date");

  var components = line.slice(line.indexOf("]") + 2).split(" ");

  var requestID = components[0];

  var responseTime = parseFloat(components[2]);

  if (isNaN(responseTime)) throw new Error("Invalid response time");

  var status = parseFloat(components[1]);

  if (isNaN(status)) throw new Error("Invalid status");

  var workerPID = components[3].slice("PID=".length);

  var url = components[4];

  var host = URL.parse(components[4]).hostname;

  return { date, requestID, responseTime, status, workerPID, url, host };
};
