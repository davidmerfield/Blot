var cheerio = require("cheerio");
var katex = require("katex");
var OPEN_TAG = "\\(";
var CLOSE_TAG = "\\)";

module.exports = function render_tex(req, res, next) {
  var send = res.send;

  res.send = function (string) {
    req.trace('starting tex render');

    var html = string instanceof Buffer ? string.toString() : string;

    var $ = cheerio.load(html, { decodeEntities: false });
    var hadTex = false;

    $(":root").each(function () {
      findTextNodes(this);
    });

    // Inject stylesheet to render TeX
    if (hadTex) {
      $("head").append(
        '<link rel="stylesheet" type="text/css" href="/css/tex.css">'
      );
    }

    // This text does not contain LaTeX
    function has_TeX(text) {
      return text.indexOf(OPEN_TAG) !== -1 && text.indexOf(CLOSE_TAG) !== -1;
    }

    function render(text) {
      var TeX = text.slice(
        text.indexOf(OPEN_TAG) + OPEN_TAG.length,
        text.indexOf(CLOSE_TAG)
      );

      TeX = katex.renderToString(TeX, { throwOnError: false });

      text =
        text.slice(0, text.indexOf(OPEN_TAG)) +
        TeX +
        text.slice(text.indexOf(CLOSE_TAG) + CLOSE_TAG.length);

      hadTex = true;

      return text;
    }

    function findTextNodes(node) {
      // if ($(node).is(ignore)) return false;

      $(node)
        .contents()
        .each(function () {
          var childNode = this;

          if (childNode.type === "text") {
            var text = childNode.data;

            while (has_TeX(text)) {
              try {
                text = render(text);
              } catch (e) {
                break;
              }
            }

            $(childNode).replaceWith(text);
          } else {
            findTextNodes(childNode);
          }
        });
    }

    html = $.html();

    req.trace('finished tex render');
    send.call(this, html);
  };

  next();
};
