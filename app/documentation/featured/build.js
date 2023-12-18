// Should only run on my machine, transforms the text-file
// which is written by humans into JSON to be read by machines
// It will build the images inside the avatars directory into
// 32x32 favicons. This could be extended to fetch other data
// about sites featured on the homepage, like template used...

var sharp = require("sharp");
var Spritesmith = require("spritesmith");
var fs = require("fs-extra");
var async = require("async");
var fetch = require("node-fetch");
var Url = require("url");
var imagemin = require("imagemin");
var pngquant = require("imagemin-pngquant");
var dirname = require("path").dirname;

var avatars = __dirname + "/avatars";
var viewDirectory = __dirname + "/../../views";
var faviconPath = "/images/featured";
var faviconDirectory = viewDirectory + faviconPath;
var result = __dirname + "/featured.json";

if (require.main === module) {
  build(function (err, sites) {
    if (err) throw err;
    fs.outputJson(result, sites, { spaces: 2 }, function (err) {
      if (err) throw err;
      process.exit();
    });
  });
}

function build (callback) {
  var output = [];

  fs.readFile(__dirname + "/sites.txt", "utf-8", async function (err, sites) {
    if (err) return callback(err);

    sites = sites.trim();

    fs.readdirSync(avatars).forEach(file => {
      let host = file.slice(0, file.lastIndexOf("."));
      if (sites.indexOf(host) > -1) return;
      // remove the file
      fs.unlinkSync(avatars + "/" + file);
    });

    generateAvatars(avatars, faviconDirectory, function (err, favicons) {
      if (err) return callback(err);

      sites = sites.split("\n");

      async.each(
        sites,
        function (site, next) {
          var words = site.split(" ");
          var color = words[0];
          var link = "https://" + words[1];
          var name = words.slice(2).join(" ").split(",")[0];
          var firstName = name.split(" ")[0];
          var bio = words.slice(2).join(" ").split(",").slice(1).join(",");
          var host = Url.parse(link).host;

          if (!favicons[host]) {
            console.log("No favicon for " + host);
            return next();
          }

          output.push({
            link: link,
            host: host,
            color: color,
            name: name,
            firstName: firstName,
            bio: bio,
            favicon: favicons[host]
          });

          next();
        },
        function (err) {
          if (err) return callback(err);

          callback(null, output);
        }
      );
    });
  });
}

function generateAvatars (source, destination, callback) {
  console.log("Building avatars:");
  console.log(" Source:", source);
  console.log(" Destination:", destination);

  var favicons = {};

  fs.readdir(source, function (err, files) {
    if (err) return callback(err);

    files.forEach(function (file) {
      var host = file.slice(0, file.lastIndexOf("."));

      if (host)
        favicons[host] = {
          input: source + "/" + file,
          output: destination + "/" + file,
          name: file
        };
    });

    async.mapValues(favicons, createFavicon, async function (err, favicons) {
      let unFilteredSrc = fs
        .readdirSync(destination)
        .filter(
          i => i.endsWith(".jpg") || i.endsWith(".jpeg") || i.endsWith(".png")
        )
        .map(i => destination + "/" + i);

      const src = [];

      // check the host is online for each favicon in src
      for (let i = 0; i < unFilteredSrc.length; i++) {
        let path = unFilteredSrc[i];
        const file = path.split("/").pop();
        let host = file.slice(0, file.lastIndexOf("."));
        try {
          // throw an error after 2 seconds if the host is not online
          const res = await fetch("https://" + host + "/verify/domain-setup", {
            timeout: 2000
          });

          const body = await res.text();

          if (!body || body.indexOf(" ") > -1 || body.length > 100)
            throw new Error("Host " + host + " is not online");

          src.push(path);
        } catch (e) {
          console.log("Removing " + host + " from the favicon");
        }
      }

      Spritesmith.run({ src }, function (err, sprite) {
        if (err) throw err;

        fs.outputFileSync(destination + ".png", sprite.image);

        imagemin([destination + ".png"], dirname(destination + ".png"), {
          plugins: [pngquant({ quality: "65", speed: 1, floyd: 1 })]
        }).then(function () {
          Object.keys(sprite.coordinates).forEach(path => {
            let name = path.split("/").pop();
            let nameWithoutExtension = name.slice(0, name.lastIndexOf("."));
            let coordinates = sprite.coordinates[path];

            // Retina
            coordinates.background_width = sprite.properties.width / 2;
            coordinates.width = coordinates.width / 2;
            coordinates.height = coordinates.height / 2;
            coordinates.x = coordinates.x / 2;
            coordinates.y = coordinates.y / 2;

            favicons[nameWithoutExtension] = {
              name,
              classname: nameWithoutExtension.split(".").join("-"),
              coordinates
            };
          });

          callback(null, favicons);
        });
      });
    });
  });
}

function createFavicon (favicon, host, callback) {
  sharp(favicon.input)
    .resize({
      width: 96,
      height: 96,
      fit: sharp.fit.cover,
      position: sharp.strategy.entropy
    })
    .toFile(favicon.output, function (err) {
      callback(err, favicon.name);
    });
}
