var async = require("async");
var Blog = require("blog");
var url_parser = require("url").parse;
var https = require("https");

var RESULT;

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

// Add new sites at the start

var sites = [
  ["diary.craigwhite.nyc", "Craig White is a visual artist based in Harlem, New York. Craig"],
  ["www.tillmanjex.info", "Tillman Jex is a composer based in Berlin. Tillman"],
  [
    "photos.rachelpietraszek.com",
    "Rachel Pietraszek is a lawyer based in Toronto. Rachel"
  ],
  [
    "blog.andrewjanjigian.com",
    "Andrew Janjigian is a photographer and editor at Cook’s Illustrated. Andrew"
  ],
  [
    "hannautkin.com",
    "Hanna Utkin is a filmmaker and producer from New York City. Hanna"
  ],
  ["keywords.oxus.net", "Kerim Friedman teaches anthropology in Taiwan. Kerim"],
  [
    "com.johnbeeler.com",
    "John Beeler is the label director at Asthmatic Kitty Records. John"
  ],
  [
    "www.matthewbattles.org",
    "Matthew Battles directs metaLAB at Harvard. Matthew’s website"
  ],
  [
    "www.rebeccatron.com",
    "Rebecca Kukshtel is an engineer based in New York City. Rebecca "
  ],

  [
    "blog.aurynn.com",
    "Aurynn Shaw is a writer and engineer from New Zealand. Aurynn’s site"
  ],
  [
    "www.kristianhjelle.com",
    "Kristian Hjelle is a designer and partner at Bakken & Bæck. Kristian"
  ],

  [
    "fagerheimen.no",
    "Fagerheimen Borettslag is an apartment building in Oslo, Norway. Its website"
  ],

  [
    "www.alexgibson.nyc",
    "Alexander Gibson is an artist from New York City. Alexander’s website"
  ],
  [
    "www.jacobyyoung.com/about",
    "Jacoby Young works at Kapālama Elementary School in Hawaii. Jacoby"
  ],

  [
    "tf2.blot.im",
    "Theo Francis is a reporter at The Wall Street Journal. Theo’s blog"
  ],
  [
    "john.pavlusoffice.com",
    "John Pavlus is a writer and filmmaker based in Portland, Oregon. John"
  ],
  [
    "sportsmanfc.com",
    "The Sportsman Flying Club is a pigeon‐racing club in Toft Hill, UK. Their website"
  ],

  [
    "www.theliminal.co",
    "The Liminal is a podcast about metaphysical speculation. Their website"
  ],

  [
    "iiiiiiiii.in",
    "Ishtaarth Dalmia writes about internet culture and economics from Bengaluru, India. Ishtaarth"
  ],
  [
    "kiefer.design",
    "Kiefer Sutherland is a freelance designer and art director. Kiefer’s website"
  ],
  [
    "www.failuretolerated.com",
    "Sean McCoy is a game designer from Dallas, Texas. Sean’s site"
  ],
  [
    "mrfris.by",
    "Stuart Frisby is the Director of Design at Booking.com. Stuart’s site"
  ],
  [
    "www.querlin.com",
    "Querlin Ricci is a designer in Atlanta. Querlin’s website"
  ]
];

module.exports = function(callback) {
  if (RESULT) return callback(null, RESULT);

  var result = [];

  // Only show the first 12 sites on the homepage
  sites = sites.slice(0, 12);

  async.eachSeries(
    sites,
    function(site, next) {
      var parsed_URL = url_parser("https://" + site[0]);

      var domain = parsed_URL.host;
      var description = site[1].trim();
      var template;
      var is_subdomain = domain.indexOf("blot.im") !== -1;
      var url, display_url, protocol, by, custom_template, template_name;
      var response = "";

      var get = https.get(
        require("url").format({
          protocol: "https",
          hostname: domain,
          pathname: "/verify/domain-setup"
        }),
        function check(res) {
          res.setEncoding("utf8");
          res.on("data", function(chunk) {
            response += chunk;
          });
          res.on("end", handle);
        }
      );

      get.on("error", function(chunk) {
        handle();
      });

      function handle() {
        if (is_subdomain) {
          by = { handle: domain.split(".blot.im").join("") };
        } else {
          by = { domain: domain };
        }

        Blog.get(by, function(err, blog) {
          if (err || !blog) {
            console.log(domain, "is not in the database");
            return next();
          }

          if (!is_subdomain && response !== blog.handle) {
            console.log(domain, "is not on blot it points to...");
            return next();
          }

          template = blog.template;

          protocol = domain.indexOf("blot.im") > -1 ? "http" : "https";

          url = protocol + "://" + site[0];
          display_url = domain.split("www.").join("");
          custom_template = template.indexOf("SITE") === -1;
          template_name = custom_template
            ? "custom"
            : capitalize(template.split("SITE:").join(""));

          description += " uses ";
          description += custom_template ? "a" : "the";
          description +=
            ' <a href="/configuring">' + template_name + "</a> template.";

          // Modify display URL for brevity. Eventually re-do design
          // so this isn't neccessary, it's cramped right now
          if (display_url === "john.pavlusoffice.com")
            display_url = "johnpavlus.com";

          if (display_url === "photos.rachelpietraszek.com")
            display_url = "rachelpietraszek.com";

          if (display_url === "blog.andrewjanjigian.com")
            display_url = "andrewjanjigian.com";

          result.push({
            url: url,
            first: result.length === 0,
            clear: (result.length + 1) % 3 === 0,
            display_url: display_url,
            description: description,
            domain: domain,
            template: template
          });

          next();
        });
      }
    },
    function() {
      RESULT = result;
      callback(null, result);
    }
  );
};
