var cheerio = require("cheerio");

module.exports = function manipulate_html(req, res, next) {
  var send = res.send;

  res.send = function(string) {
    var html = string instanceof Buffer ? string.toString() : string;

    var $ = cheerio.load(html, { decodeEntities: false });

    $("h2").each(function(i, el) {
      var subsection_id;
      var subsection_elements;
      var subsection_html;

      subsection_id =
        $(el).attr("id") ||
        $(el)
          .text()
          .split(" ")
          .join("-")
          .toLowerCase();
      subsection_elements = $(el)
        .nextUntil("h2")
        .add(el);

      $(el).removeAttr("id");

      subsection_html =
        '<div class="section" id="' +
        subsection_id +
        '">' +
        $.html(subsection_elements) +
        "</div>";

      $(subsection_elements)
        .first()
        .before(subsection_html)
        .end()
        .remove();
    });

    html = $.html();

    send.call(this, html);
  };

  next();
};
