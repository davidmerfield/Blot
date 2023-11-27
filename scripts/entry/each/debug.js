var ensure = require("helper/ensure");

var _ = require("lodash");

module.exports = function (before, after, expectedChanges, callback) {
  ensure(before, "object")
    .and(after, "object")
    .and(expectedChanges, "array")
    .and(callback, "function");

  var changes = [];

  for (var x in before) if (!_.isEqual(after[x], before[x])) changes.push(x);

  if (before.deleted && after.deleted) {
    console.log(" [DELETED] Changes to ", changes.join(","));
    return callback();
  }

  if (before.draft && after.draft) {
    console.log(" [DRAFT] Changes to ", changes.join(","));
    return callback();
  }

  if (before.scheduled && after.scheduled) {
    console.log(" [SCHEDULED] Changes to ", changes.join(","));
    return callback();
  }

  for (var i in changes) {
    var change = changes[i];

    if (expectedChanges.indexOf(change) !== -1) {
      console.log(" [EXPECTED] Change to", change);
      continue;
    }

    console.log("\n  Change to ", change);
    console.log("    Before:", before[change]);
    console.log("    After:", after[change]);
    console.log("  ");
  }

  return callback();
};
