var Email = require("helper/email");
var async = require("async");
var clfdate = require("helper/clfdate");

function main (callback) {
  var view = {};

  view.date = require("moment")().format("LL");

  const log = msg => callback => {
    console.log(clfdate(), "Daily update:", msg);
    callback(null, {});
  };

  async.map(
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
      log("Checking number of upcoming payments"),
      require("./payments"),
      log("Checking number of upcoming renewals"),
      require("./renewals"),
      log("Finished daily update")
    ],
    function (fn, next) {
      fn(function (err, res) {
        for (var i in res) view[i] = res[i];
        next();
      });
    },
    function (err) {
      console.log(view);
      Email.DAILY_UPDATE("", view, callback);
    }
  );
}

if (require.main === module) require("./cli")(main);

module.exports = main;
