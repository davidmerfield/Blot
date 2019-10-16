var moment = require("moment");
require("moment-timezone");
var formats = ["D/M/YYYY", "M/D/YYYY", "YYYY/M/D"];

var alias = {
  "D/M/YYYY": "Day-Month-Year",
  "M/D/YYYY": "Month-Day-Year",
  "YYYY/M/D": "Year-Month-Day"
};

var displays = [
  "D/M/Y",
  "M/D/Y",
  "Y/M/D",
  "MMMM D, Y",
  "MMMM D, Y [at] h:mma",
  "D MMMM Y",
  "Y-MM-DD",
  "Y-MM-DD hh:mm"
];

module.exports = function(req, res, next) {
  var displayFormats = [];
  var dateFormats = [];

  formats.forEach(function(format) {
    dateFormats.push({
      value: format,
      selected: format === req.blog.dateFormat ? "selected" : "",
      date: alias[format]
    });
  });

  displays.forEach(function(display) {
    var now = moment
      .utc(Date.now())
      .tz(req.blog.timeZone)
      .format(display);

    displayFormats.push({
      value: display,
      selected: display === req.blog.dateDisplay ? "selected" : "",
      date: now
    });
  });

  res.locals.displayFormats = displayFormats;
  res.locals.dateFormats = dateFormats;
  next();
};
