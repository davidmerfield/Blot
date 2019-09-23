function render($, callback) {
  $("img").each(function() {
    var altText = $(this).attr("alt");

    if (!altText) return;

    var ignore;

    if ($(this).hasClass("emoji")) return false;

    // Ignore images inside paragraphs.
    $(this)
      .parents("p")
      .first()
      .contents()
      .each(function() {
        // Other captions are fine.
        if ($(this).is(".caption, img")) return false;

        if (
          $(this)
            .text()
            .trim().length
        ) {
          ignore = true;
        }
      });

    if (ignore) return false;

    // This should probably replaced with figure
    // or at least caption should be a block level
    // element. This wraps awkwardly with small images

    if (
      $(this)
        .parent()
        .hasClass("image")
    ) {
      $(this)
        .parent()
        .after('<span class="caption">' + altText + "</span>");
    } else {
      $(this).after('<span class="caption">' + altText + "</span>");
    }
  });

  return callback();
}

module.exports = {
  render: render,
  category: "images",
  isDefault: false,
  title: "Caption",
  description: "Create a caption from the image’s alt text"
};
