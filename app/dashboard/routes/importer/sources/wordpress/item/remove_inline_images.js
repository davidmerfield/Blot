var debug = require("debug")("blot:importer:wordpress:remove_inline_images");
var cheerio = require("cheerio");

module.exports = function(html) {
  var $ = cheerio.load(html);

  debug($.html());

  $("p")
    .filter(function() {
      return $(this).find("img").length;
    })
    .each(function(i, p) {
      debug("here!", !$(p).text());

      if (!$(p).text()) return;

      $(this)
        .find("img")
        .each(function(i, img) {
          if (
            $(img)
              .parentsUntil(p)
              .filter("a").length
          ) {
            debug("INSIDE A TAG");
            img = $(img)
              .parentsUntil(p)
              .filter("a");
            debug(img);
          } else {
            debug("NOT INSIDE A TAG");
          }

          $("<p>" + $.html(img) + "</p>").insertBefore(p);
          $(img).remove();
        });
    });

  debug($.html());

  return $.html();
};
