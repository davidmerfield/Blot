var Entries = require("models/entries");
var arrayify = require("helper/arrayify");
var moment = require("moment");
require("moment-timezone");

module.exports = function (req, callback) {
  Entries.getAll(req.blog.id, function (allEntries) {
    var years = {};

    for (var x in allEntries) {
      var entry = allEntries[x];

      var date = moment.utc(entry.dateStamp).tz(req.blog.timeZone);

      var year = date.format("YYYY");
      var month = date.format("MMMM");

      // Init an empty data structure
      years[year] = years[year] || {
        year: year,
        months: {},
      };

      years[year].months[month] = years[year].months[month] || {
        month: month,
        entries: [],
      };

      years[year].months[month].entries.push(entry);
    }

    for (var i in years) {
      for (var j in years[i].months)
        years[i].months[j].s = years[i].months[j].entries.length > 1 ? "s" : "";

      years[i].months = arrayify(years[i].months);
    }

    years = arrayify(years).sort(function (a, b) {
      return parseInt(b.year) - parseInt(a.year);
    });

    return callback(null, years);
  });
};
