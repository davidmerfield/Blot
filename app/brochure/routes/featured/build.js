// Should only run on my machine, transforms the text-file
// which is written by humans into JSON to be read by machines
// It will build the images inside the avatars directory into
// 32x32 favicons. This could be extended to fetch other data
// about sites featured on the homepage, like template used...

var sharp = require("sharp");
var fs = require("fs-extra");
var async = require("async");
var Url = require("url");

var avatars = __dirname + "/avatars";
var viewDirectory = __dirname + "/../../views";
var faviconPath = "/images/featured";
var faviconDirectory = viewDirectory + faviconPath;
var result = __dirname + "/featured.json";

if (require.main === module) {
  build(function(err, sites) {
    if (err) throw err;
    fs.outputJson(result, sites, { spaces: 2 }, function(err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function build(callback) {
  var output = [];

  generateAvatars(avatars, faviconDirectory, function(err, favicons) {
    if (err) return callback(err);

    fs.readFile(__dirname + "/sites.txt", "utf-8", function(err, sites) {
      if (err) return callback(err);

      sites = sites.split("\n");

      async.each(
        sites,
        function(site, next) {
          var words = site.split(" ");
          var link = "https://" + words[0];
          var name = words
            .slice(1)
            .join(" ")
            .split(",")[0];
          var firstName = name.split(" ")[0];
          var bio = words
            .slice(1)
            .join(" ")
            .split(",")
            .slice(1)
            .join(",");
          var host = Url.parse(link).host;

          if (!favicons[host])
            return next(
              new Error("Please add an image to the avatars folder for " + host)
            );

          output.push({
            link: link,
            host: host,
            name: name,
            firstName: firstName,
            bio: bio,
            favicon: faviconPath + "/" + favicons[host]
          });

          next();
        },
        function(err) {
          if (err) return callback(err);

          callback(null, output);
        }
      );
    });
  });
}

function generateAvatars(source, destination, callback) {
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
      width: 64,
      height: 64,
      fit: sharp.fit.cover,
      position: sharp.strategy.entropy
    })
    .toFile(favicon.output, function(err) {
      callback(err, favicon.name);
    });
}
