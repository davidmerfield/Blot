var fs = require("fs-extra");
var async = require("async");
var fs = require("fs-extra");
var parseXML = require("xml2js").parseString;
var colors = require("colors/safe");
var log = require("single-line-log").stdout;
var Item = require("./item");

if (require.main === module) {
  var args = process.argv.slice(2);
  var outputDirectory = args.pop();
  var sourceFiles = args;

  if (!outputDirectory || !sourceFiles.length) {
    console.log(
      "Please pass XML export file(s) to convert and directory to output result:"
    );
    return console.log(
      "node index.js export.xml [other-export.xml] output-directory"
    );
  }

  console.log(colors.dim("Starting Wordpress import from"), sourceFiles);
  console.log(colors.dim("Output directory:"), outputDirectory);

  main(sourceFiles, outputDirectory, function(err) {
    if (err) throw err;

    console.log();
    console.log("Finished!");
    process.exit();
  });
}

function main(sourceFiles, outputDirectory, callback) {
  fs.emptyDirSync(outputDirectory);

  async.eachSeries(
    sourceFiles,
    function(sourceFile, next) {
      fs.readFile(sourceFile, "utf-8", function(err, xml) {
        if (err) return next(err);

        parseXML(xml, function(err, result) {
          if (err) return next(err);

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

          var totalItems = result.rss.channel[0].item.length;

          async.eachOfSeries(
            result.rss.channel[0].item,
            function(item, index, done) {
              log(colors.dim(++index + "/" + totalItems), item.title[0]);
              Item(item, outputDirectory, done);
            },
            next
          );
        });
      });
    },
    callback
  );
}

module.exports = main;
