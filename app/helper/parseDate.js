var moment = require("moment"),
  ensure = require("./ensure"),
  formatList = {
    "D/M/YYYY": formats("DMY"),
    "M/D/YYYY": formats("MDY"),
    "YYYY/M/D": formats("YMD")
  };

function parseDate(dateString, userFormat) {
  ensure(dateString, "string");

  if (userFormat === undefined || formatList[userFormat] === undefined) {
    console.log(
      userFormat + " userformat has not been passed. Please do this!"
    );
    userFormat = "M/D/YYYY";
  }

  var userFormats = formatList[userFormat];

  dateString = dateString.trim();

  if (!dateString) return false;

  // Strip cruft from date
  dateString = dateString
    .split(".")
    .join("-")
    .split("/")
    .join("-")
    .split("st")
    .join("")
    .split("nd")
    .join("")
    .split(",")
    .join(" ")
    .split("th")
    .join("")
    .split("rd")
    .join("")
    .split("--")
    .join("-")
    .trim();

  var created, strict, lazy;

  try {
    strict = moment.utc(dateString, userFormats, true);
  } catch (e) {}

  try {
    var lazyDate = dateString;
    if (lazyDate.indexOf("UTC") === -1) lazyDate += " UTC";
    lazy = moment.utc(Date.parse(lazyDate));
  } catch (e) {}

  if (strict && strict.isValid()) {
    created = strict.valueOf();
  } else if (lazy && lazy.isValid()) {
    created = lazy.valueOf();
  } else {
    created = false;
  }

  // console.log(created);
  // console.log(moment(created).format('YYYY-MM-DD hh:mm'));
  // console.log('-------------');
  return created;
}

function formats(dateFormat) {
  var M = ["M", "MM", "MMM"];
  var D = ["D", "DD"];
  var Y = ["YY", "YYYY"];

  var list = [];

  for (var a in M) for (var b in D) for (var c in Y) append(M[a], D[b], Y[c]);

  function append(m, d, y) {
    // dateFormat === 'MDY'
    var arr = [m, d, y];

    if (dateFormat === "DMY") arr = [d, m, y];

    if (dateFormat === "YMD") arr = [y, m, d];

    list.push(arr.join("-"));
  }

  return list;
}

module.exports = parseDate;
