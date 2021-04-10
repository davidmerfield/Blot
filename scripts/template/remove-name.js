var fixEachView = require("./fixEachView");
var yesno = require("yesno");
var colors = require("colors");
var jsdiff = require("diff");

fixEachView(
  function (view, callback) {
    if (view.name === "public") return callback();

    var oldcontent = (" " + view.content).slice(1);

    if (view.content.indexOf("{{name}}") > -1)
      view.content = view.content.split("{{name}}").join("{{title}}");

    if (view.content.indexOf("{{{name}}}") > -1)
      view.content = view.content.split("{{{name}}}").join("{{{title}}}");

    if (oldcontent === view.content) return callback();

    var diff = jsdiff.diffWords(oldcontent, view.content);

    diff.forEach(function (part) {
      // green for additions, red for deletions
      // grey for common parts
      var color = part.added ? "green" : part.removed ? "red" : "grey";
      process.stdout.write(part.value[color]);
    });

    process.stdout.write("\n");

    yesno.ask("Apply changes to " + view.name + "?", true, function (ok) {
      if (!ok) view.content = oldcontent;

      callback();
    });
  },
  function (err) {
    if (err) throw err;
    console.log("Fixed all views!");
    process.exit();
  }
);
