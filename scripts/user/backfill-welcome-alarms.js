// Sets the welcome email alarm for recent users who haven't been sent it.
// Run once as part of the deploy that moves welcome emails from in-process
// timers to helper/alarm: users created in the couple of hours before the
// deploy had a timer in the old master process that is now gone.
// Safe to run again: setting an alarm replaces any existing one.
//
//   node scripts/user/backfill-welcome-alarms.js [days=3]

var User = require("models/user");
var async = require("async");

var days = parseFloat(process.argv[2]) || 3;
var since = Date.now() - days * 24 * 60 * 60 * 1000;

User.getAllIds(function (err, uids) {
  if (err) throw err;

  var scheduled = 0;

  async.eachSeries(
    uids,
    function (uid, next) {
      User.getById(uid, function (err, user) {
        if (err) return next(err);

        if (!user || user.welcomeEmailSent || !(user.created >= since))
          return next();

        User.scheduleWelcomeEmail(uid, function (err) {
          if (err) return next(err);
          scheduled++;
          console.log("Scheduled welcome email alarm for", uid);
          next();
        });
      });
    },
    function (err) {
      if (err) throw err;
      console.log("Scheduled", scheduled, "welcome email alarms");
      process.exit();
    }
  );
});
