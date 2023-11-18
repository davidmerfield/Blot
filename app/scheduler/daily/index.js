var Email = require("helper/email");
var async = require("async");
var clfdate = require("helper/clfdate");
var callOnce = require("helper/callOnce");

function main (callback) {
  var view = {};

  view.date = require("moment")().format("LL");

  function log (msg) {
    return function (cb) {
      console.log(clfdate(), "Daily update:", msg);
      cb(null, {});
    };
  }

  async.mapSeries(
    [
      log("Starting daily update"),
      log("Checking free disk space"),
      require("./disk-space"),
      log("Checking free memory"),
      require("./memory"),
      log("Checking redis"),
      require("./redis"),
      log("Checking number of hits"),
      require("./hits"),
      log("Checking number of users"),
      require("./revenue"),
      log("Checking number of posts"),
      require("./entries"),
      log("Checking number of newsletter subscribers"),
      require("./newsletter-subscribers"),
      // log("Checking number of upcoming payments"),
      // require("./payments"),
      log("Checking number of upcoming renewals"),
      require("./renewals"),
      log("Finished daily update")
    ],
    function (fn, next) {
      console.log("invoking function");
      fn(
        callOnce(function (err, res) {
          console.log("invoked function");
          if (res) for (var i in res) view[i] = res[i];
          console.log("augmented view", view);
          if (view.renewals_today) {
            return Email.DAILY_UPDATE("", view, callback);
          } else {
            console.log("calling next");
            next();
          }
        })
      );
    },
    function (err) {
      console.log("calling callback");
      callback(err);
    }
  );
}

if (require.main === module) require("./cli")(main);

module.exports = main;
