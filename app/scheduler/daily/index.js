var helper = require("helper");
var Email = helper.email;
var async = require("async");

function main(callback) {
  var view = {};

  view.date = require('moment')().format('LL');
  
  async.map(
    [
      require("./disk-space"),
      require("./memory"),
      require("./hits"),
      require("./revenue"),
      require('./entries'),
      require("./newsletter-subscribers"),
      require("./renewals")
    ],
    function(fn, next) {
      fn(function(err, res) {
        for (var i in res) view[i] = res[i];
        next();
      });
    },
    function(err) {
      console.log(view);
      Email.DAILY_UPDATE("", view, callback);
    }
  );
}

if (require.main === module) require("./cli")(main);

module.exports = main;
