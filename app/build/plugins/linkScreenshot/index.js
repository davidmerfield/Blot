var Url = require("url");
const screenshot = require("helper/screenshot");

function render($, callback, { blogID }) {
  const cache = new Transformer(blogID, "screenshots");
  const link = $("p a.bookmark").first();
  const href = link.attr("href");

  if (!href) return callback();

  try {
    Url.parse(href);
  } catch (e) {
    return callback();
  }

  cache.lookup(
    href,
    function (path, next) {

    },
    function (err, info) {
      if (err) return callback();
      link.insertBefore(`<img src="${info.src}" />`)
    }
  );
}

module.exports = {
  render,
  isDefault: true,
  category: "images",
  description: "Add a screenshot of linked bookmark posts",
};
