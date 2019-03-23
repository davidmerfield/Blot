var fs = require("fs-extra");
var async = require("async");
var Url = require("url");
var generateAvatars = require("./generateAvatars");
var avatars = __dirname + "/avatars";
var viewDirectory = __dirname + "/../../views";
var faviconPath = "/images/featured";
var faviconDirectory = viewDirectory + faviconPath;

if (require.main === module) {
  main(function(err) {
    if (err) throw err;
    process.exit();
  });
}

function main(callback) {
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
          var firstName = words[1];
          var lastName = words[2];
          var name = firstName + " " + lastName;
          var bio = words.slice(3).join(" ");
          var host = Url.parse(link)
            .host.split("www.")
            .join("");

          output.push({
            link: link,
            host: host,
            name: name,
            bio: bio,
            favicon: faviconPath + "/" + favicons[host]
          });

          next();
        },
        function(err) {
          if (err) return callback(err);

          fs.outputJson(__dirname + "/output.json", output, {spaces: 2}, callback);
        }
      );
    });
  });
}
