var fs = require("fs-extra");

var initialVersion = __dirname + "/output.json";

// This will have been checked by the script to verify 
// the sites still point to Blot...
var latestVersion = __dirname + "/data/index.json";

// When the server starts, copy the featured sites in version
// control into the data directory...
fs.moveSync(initialVersion, latestVersion);

module.exports = function(req, res, next) {
  fs.readJson(__dirname + "/data/index.json", function(err, sites) {
    if (err) return next(err);

    res.locals.sites = sites;
    next();
  });
};
