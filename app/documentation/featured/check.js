const fs = require("fs-extra");
const Blog = require("models/blog");
const User = require("models/user");
const config = require("config");

const verifySiteIsOnline = require("./verifySiteIsOnline");

if (require.main === module) {
  check()
    .catch(function (err) {
      console.error(err);
      process.exit(1);
    })
    .then(function () {
      console.log("Done!");
      process.exit();
    });
}

// Should only run in production, will pull in live whether
// or not domain is still connected to Blot. In future we

async function check () {
  const featured = await fs.readJSON(__dirname + "/featured.json");

  featured.sites = await filter(featured.sites);

  await fs.outputJSON(__dirname + "/data/featured.json", featured, {
    spaces: 2
  });
}

async function filter (sites) {
  return await Promise.all(
    sites.map(async site => {
      const isOnline = await verifySiteIsOnline(site.host);
      const joined = await determineYearJoined(site.host);
      site.joined = joined;
      return isOnline ? site : null;
    })
  ).then(sites => sites.filter(i => i));
}

const determineYearJoined = domain =>
  new Promise((resolve, reject) => {
    // If we are in dev we cannot access production db info so return a random year
    // in last 6 years
    if (config.environment === "development")
      return resolve(new Date().getFullYear() - Math.floor(Math.random() * 6));

    Blog.get({ domain }, function (err, blog) {
      if (err) return reject(err);

      if (!blog) return reject(new Error("No blog with domain " + domain));

      User.getById(blog.owner, function (err, user) {
        let joined = new Date().getFullYear();

        if (user && user.subscription && user.subscription.created) {
          joined = new Date(user.subscription.created * 1000).getFullYear();
        }

        if (user && user.paypal) {
          joined = new Date(user.paypal.start_time).getFullYear();
        }

        resolve(joined);
      });
    });
  });

module.exports = check;
