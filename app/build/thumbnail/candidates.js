const cheerio = require("cheerio");
const URL = require("url");

module.exports = function (metadata, html) {
  const candidates = [];

  const $ = cheerio.load(html, { decodeEntities: false });

  // Would be nice to resolve this relative to
  // the location of the entry so we could
  // use a relative path in the thumbnail metadata
  if (metadata.thumbnail) {
    candidates.push(metadata.thumbnail);
  }

  $(".videoContainer iframe").each(function () {
    try {
      // handle vimeo
      const thumbnail = $(this).attr("data-thumbnail");

      if (thumbnail) {
        candidates.push(thumbnail);
        return;
      }

      // handle youtube
      const { hostname, pathname } = URL.parse($(this).attr("src"));

      if (hostname !== "www.youtube-nocookie.com") return;

      const id = pathname.slice("/embed/".length);

      if (!id) return;

      candidates.push(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);
      candidates.push(`http://img.youtube.com/vi/${id}/mqdefault.jpg`);

      // see here for a discussion of youtube thumbnail URLs:
      // https://stackoverflow.com/questions/2068344/how-do-i-get-a-youtube-video-thumbnail-from-the-youtube-api
    } catch (e) {
      return;
    }
  });

  $("img").each(function () {
    const src = $(this).attr("src");

    // The img lacks an src attribute – it happens!
    if (!src) return;

    // We've already added this image as a candidate
    if (candidates.indexOf(src) > -1) return;

    candidates.push(src);
  });

  return candidates;
};
