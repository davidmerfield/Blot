const fs = require("fs-extra");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const cache_directory = "./data/cache";

module.exports = async id => {
  const marcHTML = `${cache_directory}/${id}/marc.html`;

  if (!fs.existsSync(marcHTML)) {
    const marcURL = `https://www.loc.gov/pictures/item/${id}/marc/`;

    // wait 1 second to avoid triggering the rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));

    const marcPage = await fetch(marcURL);

    if (marcPage.status !== 200) {
      throw new Error("Bad status: " + marcPage.status);
    }

    fs.outputFileSync(marcHTML, await marcPage.text(), "utf-8");
  }

  const $ = cheerio.load(fs.readFileSync(marcHTML, "utf-8"));

  const result = {};

  let item;

  $("tr").each((i, el) => {
    const row = $(el);

    const cells = row.find("td");

    if (!cells.length) return;

    const tag = cells.first().text().trim();
    const code = cells.eq(3).text().trim();
    const text = cells.last().text().trim();

    if (tag) {
      if (item) {
        result[item.tag] = result[item.tag] || [];
        result[item.tag].push(item.children);
      }

      item = {
        tag,
        children: [
          {
            code,
            text
          }
        ]
      };
    } else {
      item.children.push({
        code,
        text
      });
    }
  });

  return result;
};
