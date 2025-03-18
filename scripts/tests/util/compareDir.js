var dircompare = require("dir-compare");
var format = require("util").format;

// Docs
// https://github.com/gliviu/dir-compare

module.exports = function (path1, path2, options, callback) {
  // Required
  options.compareSize = true;
  options.compareContent = true;

  // Git does not copy across datestamps but would be nice
  // options.compareDate = true;

  dircompare
    .compare(path1, path2, options)
    .then(function (res) {
      if (!res.differences) return callback();

      var message = [
        path1 + "<>" + path2 + " has " + res.differences + " differences",
      ];

      res.diffSet.forEach(function (entry) {
        if (entry.state === "equal") return;

        var state = {
          left: "->",
          right: "<-",
          distinct: "<>",
        }[entry.state];

        var name1 = entry.name1 ? entry.name1 : "";
        var name2 = entry.name2 ? entry.name2 : "";

        message.push(
          format(
            "%s(%s)%s%s(%s)",
            name1,
            entry.type1,
            state,
            name2,
            entry.type2
          )
        );
      });

      callback(new Error(message.join("\n")));
    })
    .catch(callback);
};
