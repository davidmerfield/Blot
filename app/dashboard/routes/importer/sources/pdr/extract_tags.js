var cheerio = require("cheerio");

module.exports = function(html) {
  var $ = cheerio.load(html, { decodeEntities: false });
  var class_names = $(".hpy_single_article article")
    .first()
    .attr("class");

  var tags = class_names
    .split(" ")
    .filter(function(name) {
      name = name.trim().toLowerCase();

      return (
        name &&
        name.indexOf("category-") === 0 &&
        name.indexOf("featured") === -1 &&
        name.indexOf("article") === -1
      );
    })
    .map(function(name) {
      name = name
        .trim()
        .toLowerCase()
        .slice("category-".length);
      name = name.split("-").join(" ");
      name = name[0].toUpperCase() + name.slice(1);

      if (name === "Science medicine") name = "Science";
      if (name === "Art and illustrations") name = "Art";

      return name;
    });

  return tags;
};
