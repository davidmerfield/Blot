const express = require('express');
const date = express.Router();
const resaveEntries = require("models/entries").resave;
const parse = require("dashboard/util/parse");
const formats = ["D/M/YYYY", "M/D/YYYY", "YYYY/M/D"];
const updateBlog = require("dashboard/util/update-blog");

const alias = {
  "D/M/YYYY": "Day-Month-Year",
  "M/D/YYYY": "Month-Day-Year",
  "YYYY/M/D": "Year-Month-Day",
};

const moment = require("moment");

require("moment-timezone");


date.get('/', function (req, res, next) {
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
  }, function (req, res, next) {
    var blog = req.blog;
    var when = Date.now();
  
    var zones = moment.tz.names().filter(function (s) {
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
      var time = moment.utc(when).tz(zones[i]).format("h:mm a, MMMM Do");
  
      var zone = moment.tz.zone(zones[i]);
      var offset = zone.offset(when);
  
      timeZones.push({
        time: time,
        value: zones[i],
        offset: offset,
      });
    }
  
    timeZones.sort(function (a, b) {
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
  }, (req, res) => {
    res.locals.breadcrumbs.add("Date and time", "date");
    res.render("dashboard/settings/date");
});

date.post('/', parse, async (req, res) => {
    const timeZone = req.body.timeZone;
    const dateFormat = req.body.dateFormat;

    try {
        const changes = await updateBlog(req.blog.id, {
            timeZone,
            dateFormat,
        });

        if (changes && changes.includes("timeZone") || changes.includes("dateFormat")) {
            // we need to resave entries when these settings change:
            resaveEntries(req.blog.id, function () {});
        }

        res.message(req.baseUrl, "Saved changes to date and time");
    } catch (error) {
        res.message(req.baseUrl, error);
        return;
    }
});



module.exports = date;