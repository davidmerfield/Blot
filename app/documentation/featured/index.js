// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");

module.exports = async function (req, res, next) {
  res.locals.featured = await fs.readJSON(__dirname + "/data/featured.json");

  res.locals.featured.sites = res.locals.featured.sites.map(i => {
    return {
      ...i,
      host_without_www: i.host.replace(/^www\./, "")
    };
  });

  next();
};
