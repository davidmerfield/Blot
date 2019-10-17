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
  "2019-01-18T00:00:00Z": ["18 january, 2019"] // lowercase month name
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
