var moment = require("moment");
var parseDate = require("helper").parseDate;

var supportedByAllFormats = {
  "2019-01-01T00:00:00Z": ["2019"],
  "2017-02-14T00:00:00Z": ["2017-02-14"],
  "2018-01-15T00:00:00Z": ["January 15th, 2018"],
  "2017-05-15T00:00:00Z": ['"2017-05-15"'], // surrounded by quote marks
  "2019-04-03T12:33:15Z": ["2019-04-03 12:33:15"],
  "2018-12-17T17:29:00Z": ["2018-12-17 17:29"],
  "2018-03-29T00:00:00Z": ["March 29, 2018"],
  "2015-02-10T07:26:00Z": ["February 10th, 2015 07:26"],
  "2019-01-18T00:00:00Z": ["18 january, 2019"], // lowercase month name
  "2018-04-18T00:00:00Z": ["Apr 18, 2018"],
  "2019-04-16T14:50:00Z": ["2019-04-16 02:50 PM"], // AM/PM
  "2018-06-24T14:59:27Z": ["June 24th 2018, 2:59:27 pm"], // am/pm
  "2015-01-04T05:08:00Z": ["January 4th, 2015 05:08"],
  "2015-02-04T21:14:18Z": ["Wed Feb  4 21:14:18 EST 2015"], // timezone ignored
  "2012-05-30T14:45:44Z": ["Wed May 30 2012 14:45:44 GMT+0000 (UTC)"], // timezone ignored
};

var supportedBySpecficFormat = {
  "D/M/YYYY": {
    "2016-04-18T00:00:00Z": ["18/04/2016"],
    "2018-07-19T00:00:00Z": ["19-07-2018"],
    "2019-02-05T00:00:00Z": ["5.2.2019"]
  },
  "M/D/YYYY": {},
  "YYYY/M/D": {}
};

describe("date metadata", function() {
  Object.keys(supportedByAllFormats).forEach(function(result) {
    supportedByAllFormats[result].forEach(function(metadata) {
      Object.keys(supportedBySpecficFormat).forEach(function(format) {
        it('parses "' + metadata + '" using date format ' + format, function() {
          expect(moment.utc(parseDate(metadata, format)).format()).toEqual(
            result
          );
        });
      });
    });
  });

  Object.keys(supportedBySpecficFormat).forEach(function(format) {
    Object.keys(supportedBySpecficFormat[format]).forEach(function(result) {
      supportedBySpecficFormat[format][result].forEach(function(metadata) {
        it('parses "' + metadata + '" using date format ' + format, function() {
          expect(moment.utc(parseDate(metadata, format)).format()).toEqual(
            result
          );
        });
      });
    });
  });
});
