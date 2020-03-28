var load = require("./load");
var parse = require("./parse");
var fs = require("fs-extra");

if (require.main === module)
  main(process.argv[2], function(err) {
    if (err) throw err;

    process.exit();
  });

function main(output_directory, callback) {
  if (!callback) throw new Error("Please pass a callback");

  if (output_directory)
    return callback(
      new Error("Please pass an output directory as the second argument")
    );

  load(function(err, blog) {
    if (err) return callback(err);

    fs.emptyDir(output_directory, function(err) {
      if (err) return callback(err);

      parse(output_directory, blog, callback);
    });
  });
}

module.exports = main;
