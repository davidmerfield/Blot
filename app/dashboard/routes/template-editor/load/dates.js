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

  let dateDisplay =
    req.template.locals.dateDisplay ||
    req.template.locals.date_display ||
    req.blog.dateDisplay;

  let hideDates =
    req.template.locals.hideDates ||
    req.template.locals.hide_dates ||
    req.blog.hideDates;

  displays.forEach(function (display) {
    var now = moment.utc(Date.now()).tz(req.blog.timeZone).format(display);

    displayFormats.push({
      value: display,
      selected: display === dateDisplay ? "selected" : "",
      date: now,
    });
  });

  res.locals.hideDates = hideDates;
  res.locals.displayFormats = displayFormats;
  next();
};
