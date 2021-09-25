// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");

const loadFeatured = () => {
  let featured = [];

  try {
    featured = fs.readJSONSync(__dirname + "/featured-checked.json");
  } catch (e) {
    console.log("Warning: Please check the list of featured sites:");
    console.log("node app/brochure/routes/featured/check");
  }

  return featured;
};

let featured = loadFeatured();

// Reload once per day
setInterval(function () {
  featured = loadFeatured();
}, 1000 * 60 * 60 * 24);

module.exports = function (req, res, next) {
  res.locals.featured = featured.slice();
  next();
};
