const he = require("he");
const hljs = require("highlight.js");
const cheerio = require("cheerio");



module.exports = function render(input) {
  let html = input;

  try {
    html = highlight(marked(input));
  } catch (e) {
    console.error(e);
  }

  return html;
};

function highlight(html) {
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

  return $.html();
}
