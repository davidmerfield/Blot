// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");

module.exports = function (req, res, next) {
  fs.readJSON(__dirname + "/featured-checked.json", function (err, featured) {
    if (err) {
      console.log("Warning: Please check the list of featured sites:");
      console.log("node app/documentation/featured/check");
      featured = [];
    }

    res.locals.featured = featured;
    next();
  });
};
