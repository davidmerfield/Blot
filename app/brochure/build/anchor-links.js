var cheerio = require("cheerio");
const makeSlug = require("helper/makeSlug");

module.exports = (input) => {
  const $ = cheerio.load(input, { decodeEntities: false });
  $("h2:not(h1 + h2),h3").each((i, el) => {
    const text = $(el).text();
    const id = $(el).attr("id") || makeSlug(text);
    $(el).attr("id", id || makeSlug(text));
    const innerHTML = $(el).html();
    $(el).html(`<a href="#${id}">${innerHTML}</a>`);
  });
  return $.html();
};
