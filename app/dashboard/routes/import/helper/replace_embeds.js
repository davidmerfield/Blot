module.exports = function replaceEmbeds(html, callback) {
  var $ = cheerio.load(html, { decodeEntities: false });

  $("iframe").each(function () {
    var src = $(this).attr("src");
    var vid = "";

    if (src.indexOf("youtube.com") > -1) {
      vid = parse(src).pathname;
      vid = vid.slice(vid.lastIndexOf("/") + 1);

      $(this).replaceWith("<p>https://www.youtube.com/watch?v=" + vid + "</p>");
    } else if (src.indexOf("vimeo.com") > -1) {
      vid = parse(src).pathname;
      vid = vid.slice(vid.lastIndexOf("/") + 1);

      $(this).replaceWith("<p>https://www.vimeo.com/" + vid + "</p>");
    }
  });

  return callback($.html());
};
