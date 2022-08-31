const Entry = require("models/entry");
const Entries = require("models/entries");

// Redirect to random article
module.exports = function (server) {
  server.get("/random", function (req, res, next) {
    Entries.getAllIDs(req.blog.id, function (err, entryIDs) {
      if (err || !entryIDs || !entryIDs.length) return next();
      const entryID = randomFrom(entryIDs);
      Entry.get(req.blog.id, entryID, function (entry) {
        if (err || !entry || !entry.url) return next();
        res.set("Cache-Control", "no-cache");
        res.redirect(entry.url);
      });
    });
  });
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}
