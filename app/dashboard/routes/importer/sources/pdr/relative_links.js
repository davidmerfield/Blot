module.exports = function($, url) {
  $("a").each(function(i, el) {
    var href = $(el).attr("href");

    if (href && href.indexOf(url) === 0) {
      $(el).attr("href", href.slice(url.length));
    }
  });
};
