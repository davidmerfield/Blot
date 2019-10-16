module.exports = function($) {
  $("p").each(function(i, el) {
    if (
      $(el)
        .text()
        .indexOf("Discover more recommended books") > -1
    )
      $(el).remove();
    if (
      $(el)
        .text()
        .indexOf("[easyazon_link") > -1
    )
      $(el).remove();
  });

  $(".bookinfo").each(function(i, el) {
    var text = "";

    // Remove empty p tags
    $(el)
      .find("p")
      .each(function(i, el) {
        if (
          !$(el)
            .html()
            .trim()
        )
          $(el).remove();
      });

    $(el)
      .find("span")
      .each(function(i, el) {
        text += $(el).text();

        $(el).remove();
      });

    text += $(el)
      .find(".bookauthor")
      .first()
      .text();

    $(el)
      .find(".bookauthor")
      .remove();

    $(el).prepend("<p>" + text + "</p>");
  });

  $("a").each(function(i, el) {
    $(el)
      .contents()
      .each(function fix(i, el) {
        if (el.type !== "text")
          return $(el)
            .contents()
            .each(fix);

        var text = el.data;

        // [easyazon_link identifier=“191001009X” locale=“US” tag=“thepubdomrev-20”]
        if (text.indexOf("[easyazon_link") === -1) return;

        console.log("BEFORE", text);

        var start = text.indexOf("[easyazon_link");
        var end = text.slice(start).indexOf("]") + start + 1;

        console.log(start, end);

        text = text.slice(0, start) + text.slice(end);

        console.log("AFTER", text);

        el.data = text;
      });
  });
};
