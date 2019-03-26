var schedule = require("node-schedule").scheduleJob;
var filter = require("./filter");
var config = require("config");

var Cache = require("express-disk-cache");
var cache = new Cache(config.cache_directory);

var featured = require("./featured.json");

function update() {
  console.log("Featured sites: check that the featured sites are still!");
  filter(featured, function(err, filtered) {
    if (err) return console.warn(err);

    featured = filtered;

    // Empty any existing responses
    cache.flush(config.host, function(err) {
      if (err) console.warn(err);
    });
  });
}

// I don't want the server to hang when it starts, so
// filter the list of sites asynchronously.
if (config.environment === "production") {
  update();

  console.log("Scheduled daily check of the featured sites for midnight!");
  schedule({ hour: 8, minute: 0 }, update);
}

module.exports = function(req, res, next) {
  res.locals.featured = featured;
  next();
};
