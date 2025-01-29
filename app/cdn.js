const express = require("express");
const cdn = new express.Router();
const config = require("config");

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

// e.g. thumbnails or cached images specific to a blog
cdn.use(
  express.static(config.blog_static_files_dir, {
    maxAge: "1y",
    setHeaders: function (res, path) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

// e.g. fonts or icons or other static files shared by all blogs
cdn.use(
  express.static(config.blot_directory + "/app/blog/static", {
    maxAge: "1y",
    setHeaders: function (res, path) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
  })
);

cdn.use(
  "/documentation/v-:version",
  express.static(config.views_directory, {
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
