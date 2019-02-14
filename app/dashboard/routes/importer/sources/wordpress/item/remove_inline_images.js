var debug = require("debug")("blot:importer:wordpress:tidy_caption");
var cheerio = require("cheerio");

module.exports = function(html) {
  var $ = cheerio.load(html);

  debug($.html());
    
  $("p")
    .filter(function() {
      return $(this).find("img").length;
    })
    .each(function(i, p) {
      if (!$(this).text()) return;

      $(this)
        .find("a img")
        .each(function(i, aWithImg) {
          $('<p>' + $.html(aWithImg) + '</p>').insertBefore(p);
          $(aWithImg).remove();
        });

    });

    debug($.html());

  return $.html();
};
