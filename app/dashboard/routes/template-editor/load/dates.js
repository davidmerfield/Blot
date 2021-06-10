var moment = require("moment");
require("moment-timezone");

var displays = [
  "D/M/Y",
  "M/D/Y",
  "Y/M/D",
  "MMMM D, Y",
  "MMMM D, Y [at] h:mma",
  "D MMMM Y",
  "Y-MM-DD",
  "Y-MM-DD HH:mm",
];

module.exports = function (req, res, next) {
  var displayFormats = [];

  let date_display = req.template.locals.date_display;

  let hide_dates = req.template.locals.hide_dates;

  displays.forEach(function (display) {
    var now = moment.utc(Date.now()).tz(req.blog.timeZone).format(display);

    displayFormats.push({
      value: display,
      selected: display === date_display ? "selected" : "",
      date: now,
    });
  });

  res.locals.hide_dates = hide_dates;
  res.locals.displayFormats = displayFormats;
  next();
};
