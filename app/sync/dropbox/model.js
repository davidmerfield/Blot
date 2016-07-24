var helper = require('../../helper');
var ensure = helper.ensure;
var basename = require('path').basename;

module.exports = function (change) {

  ensure(change, 'object');

  var new_change = JSON.parse(JSON.stringify(change));

  // Add name info
  new_change.name = basename(new_change.path);

  if (change.stat) {

    // Change.stat.path is usually case-sensitive.
    // We like to preserve this info if we can.
    // So overwrite change.path with the pretty version.
    new_change.path = change.stat.path;
    new_change.name = basename(new_change.path);

    new_change.stat.name = new_change.name;
    new_change.stat.size = change.stat.size;

    new_change.stat.has_thumbnail = change.stat.hasThumbnail;
    new_change.stat.human_size = change.stat.humanSize;
  }

  return new_change;
};