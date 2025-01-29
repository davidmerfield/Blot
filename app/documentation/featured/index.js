// This middleware appends the list of featured sites
// to the view used to render a page. It filters the
// list asynchronously to ensure that featured sites
// still point to Blot. This filtering should not block
// the server's boot. This filtering is also rescheduled
// once per day to ensure sites are fresh.
const fs = require("fs-extra");
const config = require("config");
const check = require("./check");

let featured = { sites: [] };

const modify = i => {

  // remove leading 'is a' or 'is an'
  i = i.replace(/^is a(n)? /, "");

  // capitalize the first letter
  i = i[0].toUpperCase() + i.slice(1);

  return i;
}

let lastCheck = 0;

const loadFeatured = async () => {
  
  if (featured.sites.length) return featured;

  // if the JSON file doesn't exist, attempt to create it using await check()
  // and only try again if it's been more than a day since the last attempt
  if (!fs.existsSync(config.data_directory + "/featured/featured.json") && Date.now() - lastCheck > 86400000) {    
    try {
      lastCheck = Date.now();
      await check();
    } catch (e) {
      console.error(e);
    }
  }

  
  try {
    const json = await fs.readFile(config.data_directory + "/featured/featured.json", "utf-8");
    featured = JSON.parse(json);
    featured.sites = featured.sites.map(i => {
        return {
          ...i,
          bio: modify(i.bio),
          host_without_www: i.host.replace(/^www\./, "")
        };
      });
    return featured;
  } catch (e) {
    console.error(e);
  }
}

module.exports = async function (req, res, next) {
  res.locals.featured = await loadFeatured();
  next();
};
