var moment = require("moment");
require("moment-timezone");

module.exports = function(req, res, next) {
  var blog = req.blog;
  var when = Date.now();

  var zones = moment.tz.names().filter(function(s) {
    if (s === "UTC") return true;

    if (s === "Pacific/Auckland") return true;

    if (s === "Pacific/Marquesas") return false;
    if (s === "America/Caracas") return false;
    if (s === "Asia/Kabul") return false;
    if (s === "Asia/Pyongyang") return false;
    if (s === "Australia/Eucla") return false;
    if (s === "Pacific/Chatham") return false;
    if (s === "US/Pacific-New") return false;
    if (s === "Asia/Tehran") return false;
    if (s === "Asia/Katmandu" || s === "Asia/Kathmandu") return false;
    if (
      s === "Etc/GMT-14" ||
      s === "Pacific/Apia" ||
      s === "Pacific/Kiritimati"
    )
      return false;

    if (s.indexOf("Etc/") === 0) return false;
    if (s.indexOf("Pacific/") === 0) return false;
    if (s.indexOf("Antarctica") !== -1) return false;

    return /\//.test(s);
  });

  var timeZones = [];

  for (var i in zones) {
    var time = moment
      .utc(when)
      .tz(zones[i])
      .format("h:mm a, MMMM Do");

    var zone = moment.tz.zone(zones[i]);
    var offset = zone.offset(when);

    timeZones.push({
      time: time,
      value: zones[i],
      offset: offset
    });
  }

  timeZones.sort(function(a, b) {
    if (b.offset - a.offset !== 0) return b.offset - a.offset;

    var nameA = a.value.toLowerCase(),
      nameB = b.value.toLowerCase();

    if (nameA < nameB)
      //sort string ascending
      return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  for (var x in timeZones)
    if (timeZones[x].value === blog.timeZone)
      timeZones[x].selected = "selected";

  res.locals.timeZones = timeZones;

  next();
};
