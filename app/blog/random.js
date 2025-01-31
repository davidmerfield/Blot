const Entries = require("models/entries");

// Redirect to random article
module.exports = function (server) {
  server.get("/random", function (req, res, next) {
    req.log("Redirecting to random entry"); 

    // We preserve the query string for random in case
    // someone wants to get the entry JSON, or find the source
    const url = req.originalUrl;
    const queryIndex = url.indexOf("?");
    const queryString = queryIndex >= 0 ? url.slice(queryIndex) : "";

    Entries.getAll(req.blog.id, function (entries) {
      if (!entries || !entries.length) return next();
      let entry = randomFrom(entries);
      let attempts = 0;
      while (!entry.url && attempts < 100) {
        entry = randomFrom(entries);
        attempts++;
      }
      if (!entry.url) return next();
      req.log("Redirecting to random entry", entry.url);
      res.set("Cache-Control", "no-cache");
      res.redirect(entry.url + queryString);
    });
  });
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
