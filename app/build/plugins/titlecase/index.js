const helper = require("helper");
const titlecase = helper.titlecase;
const cheerio = require("cheerio");

function prerender(html, callback, options) {
  const $ = cheerio.load(html);

  try {
    $('h1, h2, h3, h4, h5, h6').each(function(i, el) {
      $(this).text(titlecase($(this).text()))
    })
  } catch (e) {}

  return callback(null, $.html());
}

module.exports = {
  prerender: prerender,
  category: "Typography",
  title: "Titlecase",
  description: "Use Title Case for All Post Headings"
};