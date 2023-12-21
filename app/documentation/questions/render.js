const he = require("he");
const hljs = require("highlight.js");
const cheerio = require("cheerio");
const marked = require("marked");

module.exports = function render (input) {
  let html = input;

  try {
    html = highlight(marked(input));
  } catch (e) {
    console.error(e);
  }

  return html;
};

function highlight (html) {
  const $ = cheerio.load(html);

  $("pre code").each(function () {
    try {
      var lang = $(this).attr("class").split("language-")[1];
      console.log("lang:", lang);
      if (!lang) return;
      var code = $(this).text();
      code = he.decode(code);

      // For some reason highlight
      // doesn't play nicely with already-decoded
      // apostrophes like ' &#84; etc...

      var highlighted = hljs.highlight(lang, code).value;

      $(this).html(highlighted).addClass("hljs").addClass(lang);
    } catch (e) {}
  });

  return { body: removeXMLInvalidChars($.html()), summary: $.text() };
}

// Removes everything forbidden by XML 1.0 specifications,
// plus the unicode replacement character U+FFFD
function removeXMLInvalidChars (string) {
  var regex =
    /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;
  return string.replace(regex, "");
}
