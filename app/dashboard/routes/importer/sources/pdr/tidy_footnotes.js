var parse = require("url").parse;

module.exports = function($) {
  // Remove hr before footnotes definition
  // since the markdown parser creates a new one
  $('sup[id="fn1"]')
    .parent()
    .prevUntil("hr")
    .prev()
    .remove();

  // Fix bare URLs in footnotes
  $('sup[id^="fn"]').each(function(i, el) {
    $(el)
      .find("a")
      .each(function(i, el) {
        var link_text = $(el).text();

        if (link_text.indexOf("://") === -1) return;

        try {
          link_text = parse(link_text).host;
        } catch (e) {
          return;
        }

        if (link_text) $(el).text(link_text);
      });
  });
};
