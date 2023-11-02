var filter = require("./filter");
var fs = require("fs-extra");

if (require.main === module) {
  check(function (err) {
    if (err) throw err;
    console.log("Built!");
    process.exit();
  });
}
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

    fs.outputJSON(
      __dirname + "/featured-checked.json",
      featured,
      { spaces: 2 },
      callback
    );
  });
}

module.exports = check;
