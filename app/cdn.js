const express = require("express");
const cdn = new express.Router();
const { blot_directory } = require("config");

// Use express static and try to match the request to files in the following directories:
// $blot_directory/data/static/$uri;
// $blot_directory/app/blog/static/$uri;
// we also want to add the header 'access-control-allow-origin' to all responses

// the health check
cdn.get("/health", (req, res) => {
  // don't cache response
  res.set("Cache-Control", "no-store");
  res.send("OK: " + new Date().toISOString());
});

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

// return a 404 error otherwise
cdn.use((req, res) => {
  res.status(404).send("Not found");
});

module.exports = cdn;
