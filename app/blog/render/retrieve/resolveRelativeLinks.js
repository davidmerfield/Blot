var cheerio = require("cheerio");

// Used to resolve relative URLs
// Useful for RSS feeds

function resolve($, base) {
  return function() {
    var href = $(this).attr("href");
    var src = $(this).attr("src");

    // This is a little naive but whatever.
    // For example, what about protcolless
    // urls like //example.com/site.jpg
    if (href && href[0] === "/") {
      $(this).attr("href", base + href);
    }

    if (src && src[0] === "/") {
      $(this).attr("src", base + src);
    }
  };
}

module.exports = function(req, callback) {
  return callback(null, function() {
    return function(text, render) {
      var $;
      var base = req.protocol + "://" + req.get("host");
      text = render(text);

      try {
        $ = cheerio.load(text);

        $("[href], [src]").each(resolve($, base));

        text = $.html();
      } catch (e) {
        // do nothing
      }

      return text;
    };
  });
};
