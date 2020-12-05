let updated;

module.exports = function lastUpdated(req, res, next) {
  if (updated) {
    res.locals.updated = updated;
    return next();
  }

  const exec = require("child_process").exec;
  const moment = require("moment");

  exec("git log -1 --format=%cd", { cwd: require("helper").rootDir }, function(
    err,
    stdout
  ) {
    if (err) {
      return next();
    }
    const date = new Date(stdout.trim());
    updated = moment(date).fromNow();
    res.locals.updated = updated;
    next();
  });
};
