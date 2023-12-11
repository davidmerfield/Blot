// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");
let cached = [];

const load = async () => {
  if (cached && cached.length) return cached;

  try {
    cached = await fs.readJSON(__dirname + "/featured-checked.json");
  } catch (e) {}

  return cached;
};

module.exports = async function (req, res, next) {
  res.locals.featured = await load();
  next();
};
