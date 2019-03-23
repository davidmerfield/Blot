var fs = require("fs-extra");
var async = require("async");
var Url = require("url");
var sharp = require("sharp");

fs.readdir(__dirname + "/avatars", function(err, avatars) {
  if (err) return callback(err);

  avatars.forEach(function(avatar){
    host = avatar.slice(0, avatar.lastIndexOf('.'));
    console.log(host);
  });

  fs.readFile(__dirname + "/sites.txt", "utf-8", function(err, sites) {
    if (err) return callback(err);

    sites = sites.split("\n");

    async.each(sites, function(site, next) {
      var words = site.split(" ");
      var link = "https://" + words[0];
      var firstName = words[1];
      var lastName = words[2];
      var name = firstName + " " + lastName;
      var bio = words.slice(3).join(" ");
      var host = Url.parse(link)
        .host.split("www.")
        .join("");

      // var favicon = sharp(avatars.);

      site = {
        link: link,
        host: host,
        name: name,
        bio: bio
      };

      console.log(site);
    });
  });
});
