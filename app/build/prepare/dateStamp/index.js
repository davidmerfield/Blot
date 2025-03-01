const debug = require("debug")("blot:build:dateStamp");

const fromPath = require("./fromPath");
const fromMetadata = require("./fromMetadata");
const type = require("helper/type");

const moment = require("moment");
require("moment-timezone");

module.exports = function (blog, path, metadata) {
  const { id, dateFormat, timeZone } = blog;
  let dateStamp;

  debug("Blog:", id, "dateFormat:", dateFormat, "timeZone", timeZone, path);

  // If the user specified a date
  // field in the entry's metadata,
  // try and parse a timestamp from it.
  if (metadata.date) {
    // Since there is the possibilty of using YAML, the date might not be a string
    let dateMetadataString = String(metadata.date);
    let parsedFromMetadata = fromMetadata(dateMetadataString, dateFormat, timeZone);
    dateStamp = validate(parsedFromMetadata.created);
    if (dateStamp && parsedFromMetadata.adjusted) {
      return dateStamp;
    } else if (dateStamp) {
      return adjustByBlogTimezone(timeZone, dateStamp);
    }
  }

  if (dateStamp !== undefined) return dateStamp;

  // The user didn't specify a valid
  // date in the entry's metadata. Try
  // and extract one from the file's path
  dateStamp = validate(fromPath(path, timeZone).created);

  if (dateStamp !== undefined) {
    dateStamp = adjustByBlogTimezone(timeZone, dateStamp);
    return dateStamp;
  }

  // It is important we return undefined since we fall back
  // to the file's created date if that's the case
  return undefined;
};

function validate(stamp) {
  if (type(stamp, "number") && !isNaN(stamp) && moment.utc(stamp).isValid())
    return stamp;

  return undefined;
}

function adjustByBlogTimezone(timeZone, stamp) {
  var zone = moment.tz.zone(timeZone);
  var offset = zone.utcOffset(stamp);

  return moment.utc(stamp).add(offset, "minutes").valueOf();
}
