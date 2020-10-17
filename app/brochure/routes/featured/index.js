// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.

var schedule = require("node-schedule").scheduleJob;
var filter = require("./filter");
var config = require("config");
var clfdate = require("helper").clfdate;
var Cache = require("express-disk-cache");
var cache = new Cache(config.cache_directory);

var featured = require("./featured.json");

// Check the list of featured sites a few seconds after the server starts
// We wait a somewhat arbritary 5 seconds since Blot often fails to serve
// the site immediately and then the filter thinks the domain has moved
// elsewhere. I need to add zero-downtime deploy. Once I do, remove delay.
setTimeout(check, 1000 * 5);

console.log(clfdate(), "Featured sites: scheduled check each midnight!");
schedule({ hour: 8, minute: 0 }, check);

function check() {
  if (config.environment === "development") {
    console.log(
      clfdate(),
      "Featured sites: not checking in development environment"
    );
    return;
  }

  console.log(clfdate(), "Featured sites: checking which sites point to Blot");
  filter(featured, function (err, filtered, missing) {
    if (err) return console.log(err);

    featured = filtered;

    missing.forEach(function (site) {
      console.log(
        clfdate(),
        "Featured sites:",
        site.host,
        "no longer points to Blot"
      );
    });

    cache.flush(config.host, function (err) {
      if (err) console.log(err);

      console.log(clfdate(), "Featured sites: check completed!");
    });
  });
}

module.exports = function (req, res, next) {
  // Strip the 'www' from the host property for aesthetics
  res.locals.featured = featured.slice().map(function (site) {
    site.host = site.host.split("www.").join("");
    site.template = site.template || {};
    site.template.label = site.template.label || "Diary";
    site.template.slug = site.template.slug || "diary";
    return site;
  });

  // randomize
  for (let i = res.locals.featured.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const temp = res.locals.featured[i];
    res.locals.featured[i] = res.locals.featured[j];
    res.locals.featured[j] = temp;
  }

  res.locals.featured = res.locals.featured.slice(0, 36);

  next();
};
