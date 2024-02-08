const fs = require("fs-extra");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cache_directory = __dirname + "/data/cache";

module.exports = async id => {
  const pageHTML = `${cache_directory}/${id}/page.html`;
  if (!fs.existsSync(pageHTML)) {
    const pageURL = `https://www.loc.gov/pictures/item/${id}/`;

    // wait 1 second to avoid triggering the rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));

    const page = await fetch(pageURL);

    if (page.status !== 200) {
      throw new Error("Bad status: " + page.status);
    }

    fs.outputFileSync(pageHTML, await page.text(), "utf-8");
  }

  return cheerio.load(fs.readFileSync(pageHTML, "utf-8"));
};
