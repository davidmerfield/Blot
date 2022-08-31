const Entries = require("models/entries");

// Redirect to random article
module.exports = function (server) {
  server.get("/random", function (req, res, next) {
    Entries.getAll(req.blog.id, function (entries) {
      if (!entries || !entries.length) return next();
      let entry = randomFrom(entries);
      let attempts = 0;
      while (!entry.url && attempts < 100) {
        entry = randomFrom(entries);
        attempts++;
      }
      if (!entry.url) return next();
      res.set("Cache-Control", "no-cache");
      res.redirect(entry.url);
    });
  });
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
