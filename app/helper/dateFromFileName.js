var moment = require("moment"),
  ensure = require("./ensure");

function dateFromFileName(path) {
  var created, parsed, fileName, tokens;
  var year, month, day;
  var hour, minute, second;

  ensure(path, "string");

  path = path.trim();

  if (!path) return false;

  // '/1/2/3-4.txt' -> ['',1','2','3','4.txt']
  tokens = path.split(/-|\/|_|\s|\./);

  for (var i = 0; i < tokens.length; i++) {
    // There aren't enough remaing tokens to form
    // a valid date. This show stops now.
    if (tokens[i + 2] === undefined) break;

    year = parseYear(tokens[i]);
    month = parseMonth(tokens[i + 1]);
    day = parseDay(tokens[i + 2]);
    hour = parseHour(tokens[i + 3]);
    minute = parseMinute(tokens[i + 4]);
    second = parseSecond(tokens[i + 5]);

    // I require a valid year, month and day
    // before parsing a date from this path.
    if (year === false || month === false || day === false) {
      continue;
    }

    var numberOfValidTokens = 3;

    if (hour !== false) numberOfValidTokens++;
    if (hour !== false && minute !== false) numberOfValidTokens++;
    if (hour !== false && minute !== false && second !== false)
      numberOfValidTokens++;

    // only care about minute if hour is valid
    // only care about second  if hour and minute are valid
    // The hour, minute and second are not
    // 100% neccessary IMO so I default to midnight
    second = (hour !== false && minute !== false && second) || 0;
    minute = (hour !== false && minute) || 0;
    hour = hour || 0;

    var composed = [
      year,
      pad(month),
      pad(day),
      pad(hour),
      pad(minute),
      pad(second)
    ].join("-");

    parsed = moment.utc(composed, ["YYYY-MM-DD-HH-mm-ss"]);

    // We found a valid date
    if (parsed.isValid()) {
      created = parsed;

      var invalidTokens = tokens.slice(i + numberOfValidTokens);
      var lengthOfInvalidTokens =
        invalidTokens.join("").length + invalidTokens.length;
      var pathOfInvalidTokens = path.slice(-lengthOfInvalidTokens);

      // Try to seperate the numbers which are part of the date
      // from the file name. This is used later to generate titles aautomatically.
      fileName = pathOfInvalidTokens.trim();

      if (fileName.lastIndexOf("/") !== -1)
        fileName = fileName.slice(fileName.lastIndexOf("/") + 1);

      if (fileName.slice(0, 1) === "-" || fileName.slice(0, 1) === "_")
        fileName = fileName.slice(1);

      break;
    }
  }

  return (
    created !== undefined && {
      created: created.valueOf(),
      fileName: fileName
    }
  );
}

function parseYear(token) {
  return (
    token !== false &&
    token !== null &&
    token !== undefined &&
    token.length === 4 &&
    !isNaN(parseInt(token)) &&
    parseInt(token)
  ); // this is returned
}

function parseMonth(token) {
  return within(parseTime(token), 1, 12);
}

function parseDay(token) {
  return within(parseTime(token), 1, 31);
}

function parseHour(token) {
  return within(parseTime(token), 0, 24);
}

function parseMinute(token) {
  return within(parseTime(token), 0, 60);
}

function parseSecond(token) {
  return parseMinute(token);
}

function within(num, min, max) {
  return (
    num !== false &&
    num !== undefined &&
    num !== null &&
    num >= min &&
    num <= max &&
    num
  ); // the last value is returned
}

function parseTime(token) {
  return (
    token !== false &&
    token !== undefined &&
    token !== null &&
    token.length &&
    token.length < 3 &&
    !isNaN(parseInt(token)) &&
    parseInt(token)
  ); // the last value is returned
}

function pad(number) {
  number = number.toString();

  if (number.length === 1) number = "0" + number;

  return number;
}

(function tests() {
  var assert = require("assert");

  function check(str, date, fileName) {
    // console.log();
    // console.log(str)
    var res = dateFromFileName(str);

    try {
      if (date === false) {
        assert(res === false, "Parsed date when none should have been");
        return;
      }

      assert(res.created === date, "Incorrect datestamp");
      assert(res.fileName === fileName, "Incorrect fileName");
    } catch (e) {
      console.log();
      console.log("----------------------------------------");
      console.log("Test failed for", '"' + str + '"');
      console.log("----------------------------------------");

      if (res === false) console.log("No date parsed");
      else {
        console.log(
          "DATE       parsed:",
          res.created,
          moment.utc(res.created).format("YYYY-M-D HH:mm:ss")
        );
        console.log(
          "         expected:",
          date,
          moment.utc(date).format("YYYY-M-D HH:mm:ss")
        );
        console.log("----------------------------------------");
        console.log("FILENAME   parsed:", res.fileName);
        console.log("         expected:", fileName);
      }

      console.log();
      console.log();
    }
  }

  var stamp = 1453075200000;

  // Has 'no' filename
  check("2016_1_18.txt", stamp, ".txt");

  // Invalid dates
  check("2016-100-180-foo.txt", false);
  check("20162-100-180-foo.txt", false);
  check("2016-ABC-12-foo.txt", false);
  check("ABC-2016-ABC-12-foo.txt", false);

  // Valid dates
  check("/2016/1/18/foo-bar-baz.txt", stamp, "foo-bar-baz.txt");
  check("/2016-1-18 Avatar.txt", stamp, "Avatar.txt");
  check("/2016-1-18-foo.txt", stamp, "foo.txt");
  check("2016-01-18-foo.txt", stamp, "foo.txt");
  check("2016_1_18-foo.txt", stamp, "foo.txt");
  check("/2016/1/18/foo.txt", stamp, "foo.txt");
  check("/2016/1/18-foo.txt", stamp, "foo.txt");
  check("/2016/1_18-foo.txt", stamp, "foo.txt");
  check("2016/1/18-foo.txt", stamp, "foo.txt");

  check("/1999-08-1-123456.txt", 933465600000, "123456.txt");
  check("1999/8-01/123456.txt", 933465600000, "123456.txt");

  check("/nest/dir/2016/1_18-foo.txt", stamp, "foo.txt");
  check("/nest/dir/2016/1/18_foo.txt", stamp, "foo.txt");

  // Invalid leading dir
  check("2016/07/32/2016-1-18-test.txt", stamp, "test.txt");

  // Valid Hour as well
  check("2013-09-18-19.20.36.jpg", 1379532036000, ".jpg");
  check("2013-01-31-00.00.1.jpg", 1359590401000, ".jpg");

  // Invalid hour
  check("2013-01-31-100-322-1-4.jpg", 1359590400000, "100-322-1-4.jpg");
})();

module.exports = dateFromFileName;
