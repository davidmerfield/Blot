var sharp = require("sharp");
var fs = require("fs-extra");
var async = require("async");

function main(source, destination, callback) {
  console.log("Building avatars:");
  console.log(" Source:", source);
  console.log(" Destination:", destination);

  var favicons = {};

  fs.readdir(source, function(err, files) {
    if (err) return callback(err);

    files.forEach(function(file) {
      var host = file.slice(0, file.lastIndexOf("."));

      if (host)
        favicons[host] = {
          input: source + "/" + file,
          output: destination + "/" + file,
          name: file
        };
    });

    async.mapValues(favicons, createFavicon, callback);
  });
}

function createFavicon(favicon, host, callback) {
  sharp(favicon.input)
    .resize({
      width: 32,
      height: 32,
      fit: sharp.fit.cover,
      position: sharp.strategy.entropy
    })
    .toFile(favicon.output, function(err, info) {
      callback(err, favicon.name);
    });
}

if (require.main === module) {
  main(__dirname + "/avatars", __dirname + "/favicons", function(err, avatars) {
    if (err) throw err;
    console.log(avatars);
    process.exit();
  });
}

module.exports = main;
