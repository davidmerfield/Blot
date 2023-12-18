var filter = require("./filter");
var fs = require("fs-extra");

if (require.main === module) {
  check(function (err) {
    if (err) throw err;
    console.log("Built!");
    process.exit();
  });
}

const tidy = bio => {
  // if the bio ends with 'based in...' or 'from ...'
  // remove everything after that
  bio = bio.trim();

  const basedIn = bio.indexOf(" based in ");

  if (basedIn > -1) {
    bio = bio.slice(0, basedIn);
  }

  const from = bio.indexOf(" from ");

  if (from > -1) {
    bio = bio.slice(0, from);
  }

  return bio;
};

const { toUnicode } = require("helper/punycode");

// Should only run in production, will pull in live whether
// or not domain is still connected to Blot. In future we
// could run other tests, e.g. to ensure an even balance of
// templates on the homepage. "sites" are a list of objects
// with the following relevant properties:
// { "link": "http://example.com", "host": "example.com" }
function check (callback) {
  var featured = fs.readJSONSync(__dirname + "/featured.json");

  filter(featured, function (err, filtered) {
    if (err) return callback(err);

    featured = filtered.map(function (site) {
      site.host = site.host.split("www.").join("");
      site.template = site.template || {};
      site.template.label = site.template.label || "Blog";
      site.template.slug = site.template.slug || "blog";
      return site;
    });

    width = featured[0].favicon.coordinates.width;
    height = featured[0].favicon.coordinates.height;
    background_width = featured[0].favicon.coordinates.background_width;

    featured = featured.map(site => {
      return {
        name: site.name,
        bio: tidy(site.bio.trim()),
        host: toUnicode(site.host),
        link: site.link,
        x: site.favicon.coordinates.x,
        y: site.favicon.coordinates.y,
        joined: site.joined,
        color: site.color,
        hue: hexToHSL(site.color)
      };
    });

    fs.outputJSON(
      __dirname + "/featured-checked.json",
      { sites: featured, width, height, background_width },
      { spaces: 2 },
      callback
    );
  });
}

function hexToHSL (H) {
  // Convert hex to RGB first
  let r = 0,
    g = 0,
    b = 0;
  if (H.length == 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length == 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
  }
  // Then to HSL
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return h;
}

module.exports = check;
