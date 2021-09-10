var cheerio = require("cheerio");

module.exports = function (metadata, html) {
  var candidates = [];

  var $ = cheerio.load(html, { decodeEntities: false });

  // Would be nice to resolve this relative to
  // the location of the entry so we could
  // use a relative path in the thumbnail metadata
  if (metadata.thumbnail) {
    candidates.push(metadata.thumbnail);
  }

  $("img").each(function () {
    var src = $(this).attr("src");

    // The img lacks an src attribute – it happens!
    if (!src) return;

    // We've already added this image as a candidate
    if (candidates.indexOf(src) > -1) return;

    candidates.push(src);
  });

  return candidates;
};
