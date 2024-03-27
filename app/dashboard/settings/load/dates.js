var moment = require("moment");
require("moment-timezone");
var formats = ["D/M/YYYY", "M/D/YYYY", "YYYY/M/D"];

var alias = {
  "D/M/YYYY": "Day-Month-Year",
  "M/D/YYYY": "Month-Day-Year",
  "YYYY/M/D": "Year-Month-Day",
};

module.exports = function (req, res, next) {
  res.locals.currentTime = moment
    .utc(Date.now())
    .tz(req.blog.timeZone)
    .format("h:mma, MMMM D");

  var dateFormats = [];

  formats.forEach(function (format) {
    dateFormats.push({
      value: format,
      selected: format === req.blog.dateFormat ? "selected" : "",
      date: alias[format],
    });
  });

  res.locals.dateFormats = dateFormats;
  next();
};
