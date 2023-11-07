const express = require("express");
const cdn = new express.Router();
const { blot_directory } = require("config");
const compression = require("compression");

// Use express static and try to match the request to files in the following directories:
// $blot_directory/data/static/$uri;
// $blot_directory/app/blog/static/$uri;
// we also want to use maximum gzip compression and set the max age to 1 year
// we also want to add the header 'access-control-allow-origin' to all responses

cdn.use(compression({ level: 9 }));

cdn.use(
  express.static(blot_directory + "/data/static", {
    maxAge: "1y",
    setHeaders: function (res, path) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

cdn.use(
  express.static(blot_directory + "/app/blog/static", {
    maxAge: "1y",
    setHeaders: function (res, path) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

module.exports = cdn;
