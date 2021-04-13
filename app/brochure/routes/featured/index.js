// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
var featured = [];

try {
  featured = require("./featured-checked.json");
} catch (e) {
  console.log("Warning: Please check the list of featured sites:");
  console.log("node app/brochure/routes/featured/check");
}

module.exports = function (req, res, next) {
  // Strip the 'www' from the host property for aesthetics
  res.locals.featured = featured.slice();

  res.locals.featured = res.locals.featured;

  next();
};
