var eachEntry = require("../each/entry");
var parseDate = require("helper/parseDate");
var dateStamp = require("build/prepare/dateStamp");
var moment = require("moment");
var fs = require("fs-extra");
var supportedMetadataFormats = {};

eachEntry(
  function (user, blog, entry, next) {
    if (!entry.metadata.date) return next();

    try {
      var dateFromDateStamp = new Date(entry.dateStamp);
      var parsedDateStamp = parseDate(entry.metadata.date, blog.dateFormat);
      var zone = moment.tz.zone(blog.timeZone);
      var offset = zone.offset(parsedDateStamp);
      var adjustedParsedDateStamp = moment
        .utc(parsedDateStamp)
        .add(offset, "minutes")
        .valueOf();

      var dateFromAdjustedParsedMetadata = new Date(adjustedParsedDateStamp);
    } catch (e) {
      return next();
    }

    // The metadata date was not used to generate the entry's datestamp
    if (entry.dateStamp !== adjustedParsedDateStamp) return next();

    // console.log('Input:')
    // console.log(' entry.metadata.date', entry.metadata.date);
    // console.log(' parsedDateStamp', parsedDateStamp, new Date(parsedDateStamp));
    // console.log(' adjustedParsedDateStamp', adjustedParsedDateStamp, new Date(adjustedParsedDateStamp));
    // console.log();
    // console.log('Result:')
    // console.log(' entry.dateStamp', entry.dateStamp, new Date(entry.dateStamp));
    // console.log(' entry.dateStamp === adjustedParsedDateStamp', entry.dateStamp === adjustedParsedDateStamp);

    supportedMetadataFormats[blog.dateFormat][entry.metadata.date] =
      entry.dateStamp;
    console.log(entry.metadata.date);
    next();
  },
  function (err) {
    fs.outputJsonSync(__dirname + "/res.json", supportedMetadataFormats);
    console.log("Done!");
    process.exit();
  }
);

function adjustDateStampByTimeZone(timeZone, dateStamp) {}
