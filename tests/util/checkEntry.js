var assert = require("assert");
var colors = require("colors");

function pad(len) {
  var str = "";
  while (str.length < len) str += " ";
  return str;
}

// Check if an entry with the passed properties exists in DB
module.exports = function CheckEntry(blogID) {
  return function check(entry, callback, callcount = 0) {
    require("models/entry").get(blogID, entry.path, function (result) {
      if (!result) {
        if (callcount < 50) {
          return setTimeout(() => check(entry, callback, callcount + 1), 100);
        } else {
          return callback(new Error("No entry " + entry.path));
        }
      }

      var message = ["checking entry " + entry.path];

      for (var i in entry) {
        try {
          assert.deepEqual(
            entry[i],
            result[i],
            i +
              colors.dim(" [expected] ") +
              entry[i] +
              colors.dim("\n" + pad(i.length + 1) + "[returned] ") +
              result[i]
          );
        } catch (e) {
          message.push(e.message);
        }
      }

      if (message.length > 1) {
        return callback(new Error(message.join("\n")));
      } else {
        return callback(null, result);
      }
    });
  };
};
