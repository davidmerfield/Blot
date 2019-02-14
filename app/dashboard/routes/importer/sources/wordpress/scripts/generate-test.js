// This script will find an <item> or blog post inside a Wordpress export
// file and generate a new test for it.

var cheerio = require("cheerio");
var fs = require("fs-extra");

var sourceFile = process.argv[2];
var filter = process.argv[3];
var testsDirectory = require("path").resolve(__dirname + "/../tests/examples/");

if (!sourceFile || !filter)
  throw new Error(
    "Please pass source export file as first argument and filter for <item> as second argument"
  );

var $ = cheerio.load(fs.readFileSync(sourceFile, "utf-8"), {
  withDomLvl1: false,
  normalizeWhitespace: false,
  xmlMode: true,
  decodeEntities: false
});

var candidates = $("item").filter(function() {
  var title = $(this)
    .find("title")
    .text();
  return (
    title.toLowerCase().indexOf(filter.toLowerCase()) > -1 ||
    digest(title) === filter
  );
});

if (!candidates.length)
  throw new Error('No item titles matched "' + filter + '"');

if (candidates.length > 1) {
  console.log(
    'Multiple item titles matched "' +
      filter +
      '". Please select one of the following:'
  );

  $(candidates).each(function(i, el) {
    console.log();
    console.log(
      ++i +
        ". " +
        $(el)
          .find("title")
          .text()
    );
    console.log(
      "node scripts/generate-test.js " +
        process.argv[2] +
        " " +
        digest(
          $(el)
            .find("title")
            .text()
        )
    );
  });

  return process.exit();
}

var title = $(candidates[0])
  .find("title")
  .text();
var folder = testsDirectory + "/" + digest(title);
var path = folder + "/item.xml";

fs.outputFileSync(path, $.html(candidates[0]));

console.log("Generated new test for \"" + title + "\" in:");
console.log(folder);

function digest(str) {
  return require("crypto")
    .createHash("md5")
    .update(str)
    .digest("hex")
    .slice(0, 7);
}
