var fs = require("fs-extra");
var async = require("async");
var fs = require("fs-extra");
var parseXML = require("xml2js").parseString;
var colors = require("colors/safe");
var log = require("single-line-log").stdout;
var Item = require("./item");

if (require.main === module) {
  var options = {};
  var outputDirectory = process.argv[3];
  var sourceFile = process.argv[2];

  options.filter = process.argv[4];

  if (!outputDirectory || !sourceFile.length) {
    console.log(
      "Please pass XML export file to convert and directory to output result:"
    );
    return console.log(
      "node index.js export.xml output-directory [filter-item-by-title]"
    );
  }

  console.log(colors.dim("Starting Wordpress import from"), sourceFile);
  console.log(colors.dim("Output directory:"), outputDirectory);

  main(sourceFile, outputDirectory, options, function(err) {
    if (err) throw err;

    console.log();
    console.log("Finished!");
    process.exit();
  });
}

function main(sourceFile, outputDirectory, options, callback) {
  fs.emptyDirSync(outputDirectory);

  fs.readFile(sourceFile, "utf-8", function(err, xml) {
    if (err) return callback(err);

    parseXML(xml, function(err, result) {
      if (err) return callback(err);

      console.log();
      console.log(result.rss.channel[0].title[0]);
      console.log(colors.dim("Site URL:"), result.rss.channel[0].link[0]);
      console.log(
        colors.dim("Export Version"),
        result.rss.channel[0]["wp:wxr_version"][0]
      );

      // If you want to see other properties available,
      // log this to STDOUT
      // console.log(result.rss.channel);

      if (options.filter) {
        result.rss.channel[0].item = result.rss.channel[0].item.filter(function(
          item
        ) {
          return item.title[0].toLowerCase().indexOf(options.filter) > -1;
        });
      }

      var totalItems = result.rss.channel[0].item.length;

      async.eachOfSeries(
        result.rss.channel[0].item,
        function(item, index, done) {
          log(colors.dim(++index + "/" + totalItems), item.title[0].trim());
          Item(item, outputDirectory, done);
        },
        callback
      );
    });
  });
}

module.exports = main;
