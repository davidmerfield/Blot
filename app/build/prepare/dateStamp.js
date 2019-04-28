var helper = require("helper");
var ensure = helper.ensure;
var debug = require("debug")("blot:build:dateStamp");

var dateFromFileName = helper.dateFromFileName;
var parseDate = helper.parseDate;
var type = helper.type;

var moment = require("moment");
require("moment-timezone");

module.exports = function(blog, path, metadata) {
  ensure(blog, "object")
    .and(path, "string")
    .and(metadata, "object");

  debug(
    "Blog:",
    blog.id,
    "dateFormat:",
    dateFormat,
    "timeZone",
    timeZone,
    path
  );

  // Now we deal with a custom date!
  var dateFormat = blog.dateFormat;
  var timeZone = blog.timeZone;

  var date = metadata.date || "";
  var dateStamp = metadata.dateStamp || undefined;

  debug("Blog:", blog.id, "dateStamp #1", dateStamp);

  ensure(dateFormat, "string").and(timeZone, "string");

  // The user specified a date stamp
  // directly. Try to turn it into an integer
  if (dateStamp !== undefined) dateStamp = validate(parseInt(dateStamp));

  debug("Blog:", blog.id, "dateStamp #2", dateStamp);

  // Return early since we have a date stamp
  if (dateStamp) return dateStamp;

  // If the user specified a date
  // field in the entry's metadata,
  // try and parse a timestamp from it.
  if (date && dateStamp === undefined)
    dateStamp = validate(parseDate(date, dateFormat));

  debug("Blog:", blog.id, "dateStamp #3", dateStamp);

  // The user didn't specify a valid
  // date in the entry's metadata. Try
  // and extract one from the file's path
  if (dateStamp === undefined) {
    dateStamp = validate(dateFromFileName(path).created);
  }

  debug("Blog:", blog.id, "dateStamp #4", dateStamp);

  // If there is a date string specified as
  // part of this post's metadata, try to parse
  // a timestamp from this. We need to relativize
  // this to the user's timezone because 'Jan 1st 2012'
  // in the file of post means different timestamps
  //  in different time zones.
  if (dateStamp !== undefined)
    dateStamp = validate(adjust(timeZone, dateStamp));

  debug("Blog:", blog.id, "dateStamp #5", dateStamp);

  return dateStamp;
};

function validate(stamp) {
  if (type(stamp, "number") && !isNaN(stamp) && moment.utc(stamp).isValid())
    return stamp;

  return undefined;
}

function adjust(timeZone, stamp) {
  ensure(timeZone, "string").and(stamp, "number");

  var zone = moment.tz.zone(timeZone);
  var offset = zone.offset(stamp);

  return moment
    .utc(stamp)
    .add(offset, "minutes")
    .valueOf();
}
