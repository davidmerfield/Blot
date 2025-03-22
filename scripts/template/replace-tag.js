var fixEachView = require("./fixEachView");
var containsTagWithName = /{{#tags}}(.|\n|\r)*({{name}})(.|\n|\r)*{{\/tags}}/g;
var getConfirmation = require("../util/getConfirmation");
var jsdiff = require("diff");

fixEachView(
  function (view, callback) {
    var totalChanges = 0;

    var after = view.content.replace(containsTagWithName, function (v) {
      totalChanges++;
      var result = v.split("{{name}}").join("{{tag}}");
      var diff = jsdiff.diffWords(v, result);

      diff.forEach(function (part) {
        // green for additions, red for deletions
        // grey for common parts
        var color = part.added ? "green" : part.removed ? "red" : "grey";
        process.stdout.write(part.value[color]);
      });

      process.stdout.write("\n");

      return result;
    });

    if (!totalChanges) return callback();

    getConfirmation(
      "Apply " + totalChanges + " changes to " + view.name + "?",
      function (err, ok) {
        if (ok) view.content = after;

        if (view.content.indexOf("{{name}}") > -1)
          console.log(view.name, "still has {{name}}");

        callback();
      }
    );
  },
  function (err) {
    if (err) throw err;
    console.log("Fixed all views!");
    process.exit();
  }
);
