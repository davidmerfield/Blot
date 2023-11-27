var sources = require("./sources");
var fs = require("fs-extra");

for (var i in sources) {
  var label = sources[i];

  label = label.split("\n").join("");
  label = label.split("\r").join("");
  label = label.split("\t").join("");

  sources[i] = label;
}

fs.outputJsonSync("sources-fixed.json", sources, { spaces: 2 });
console.log("Done!");
