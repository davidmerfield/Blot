var thumbnails = require("fs-extra")
  .readFileSync(__dirname + "/thumbnails.txt", "utf-8")
  .trim()
  .split("\n");

module.exports = function($) {
  var thumbnail, src;

  // Fix bare URLs in footnotes
  $("img").each(function(i, el) {
    src = $(el).attr("src");

    if (thumbnails.indexOf(src) > -1 && !!thumbnail) {
      console.log(thumbnail);
      console.log(src);
      throw new Error(
        "Two valid thumbnails for a given entry, remove one of them"
      );
    }

    if (thumbnails.indexOf(src) > -1 && !thumbnail) {
      thumbnail = src;
      console.log("FOUND A THUMBNAIl", thumbnail);
    }
  });

  return thumbnail;
};
