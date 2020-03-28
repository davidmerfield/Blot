module.exports = function($) {
  // This was a specific issue with
  // https://publicdomainreview.org/2017/05/31/gustav-wunderwalds-paintings-of-weimar-berlin/
  // and produced markdown that pandoc couldn't parse
  $("p strong br").remove();

  var has_upper_case = false;
  var has_lower_case = false;

  $("p").each(function(i, el) {
    if ($(el).text() === "PUBLIC DOMAIN WORKS") has_upper_case = true;

    if (
      $(el)
        .text()
        .toLowerCase() === "public domain works" &&
      !has_upper_case
    )
      has_lower_case = true;
  });

  if (has_upper_case && has_upper_case) {
    $("p").each(function(i, el) {
      if ($(el).text() === "PUBLIC DOMAIN WORKS") $(el).remove();
    });
  }

  // This papers over a bug with readability which clipped
  // the last list in the article.
  $("p").each(function(i, el) {
    var text = $(el).text();

    if (text !== "Public Domain Works") return;

    var next_text = "";

    $(el)
      .nextAll()
      .each(function(i, el) {
        next_text += $(el)
          .text()
          .trim();
      });

    if (!next_text) {
      $(el)
        .prevUntil("hr")
        .prev()
        .remove();
      $(el).remove();
    }
  });
};
