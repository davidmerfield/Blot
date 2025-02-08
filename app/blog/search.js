const Entry = require('models/entry');
const search = require('util').promisify(Entry.search);

module.exports = async (req, res, next) => {

  let entries = [];

  if (req.query.q) {
    try {
      entries = await search(req.blog.id, req.query.q);
    } catch (err) {
      return next(err);
    }
  }  

  res.locals.query = req.query.q;
  res.locals.entries = entries || [];

  // Don't cache search results
  res.set("Cache-Control", "no-cache");
  res.renderView("search.html", next);
};