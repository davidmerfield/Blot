var eachView = require("../each/view");
var query = process.argv[2];
var total = 0;
var matches = 0;

eachView(
  function (user, blog, template, view, next) {
    if (!view || !view.content) return next();

    total++;

    if (view.content.indexOf(query) === -1) return next();

    matches++;

    console.log(template.name, view.name, "matches:");

    view.content.split("\n").forEach(function (line, i) {
      if (line.indexOf(query) === -1) return;

      console.log("Line " + i, line);
    });

    next();
  },
  function (err) {
    if (err) throw err;
    console.log("Searched all " + total + " views.");
    console.log("Found " + matches + ' views containing "' + query + '"');
    process.exit();
  }
);
