// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");

let featured = { sites: [] };

const modify = i => {

  // remove leading 'is a' or 'is an'
  i = i.replace(/^is a(n)? /, "");

  // capitalize the first letter
  i = i[0].toUpperCase() + i.slice(1);

  return i;
}


try {
 featured = JSON.parse(fs.readFileSync(__dirname + "/data/featured.json", "utf-8"));
 featured.sites = featured.sites.map(i => {
    return {
      ...i,
      bio: modify(i.bio),
      host_without_www: i.host.replace(/^www\./, "")
    };
  });
} catch (e) {
  console.error(e);
}


module.exports = async function (req, res, next) {
  res.locals.featured = featured;
  next();
};
