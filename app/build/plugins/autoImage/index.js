var mime = require("mime");

function render($, callback) {
  $("a").each(function() {
    try {
      var href = $(this).attr("href");
      var text = $(this).text();
      var isImage = IsImage(href);

      if (href && isImage && href === text) {
        $(this).replaceWith(template(href));
      }
    } catch (e) {}
  });

  callback();
}

function template(url) {
  return '<img src="' + url + '" />';
}

function IsImage(url) {
  return url && mime.lookup(url) && mime.lookup(url).slice(0, 6) === "image/";
}

module.exports = {
  render: render,
  category: "images",
  title: "Images",
  description: "Embed images from image URLs"
};
