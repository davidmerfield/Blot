var cheerio = require("cheerio");
var fs = require("fs");
var parseCSS = require("css");
var CleanCSS = require("clean-css");
var minimize = new CleanCSS();

module.exports = function (req, res, next) {
  var send = res.send;

  res.send = function(string) {
    var html = string instanceof Buffer ? string.toString() : string;
    var css = "";
    var $ = cheerio.load(html, { decodeEntities: false });

    $('link[rel="stylesheet"]').each(function() {
      if ($(this).attr("data-skip-inline")) {
        return;
      }

      var css = "";
      var href = $(this).attr("href");

      if (href.indexOf("?") > -1) href = href.slice(0, href.indexOf("?"));

      var pathToCSSFile = __dirname + "/../../views" + href;

      try {
        css = fs.readFileSync(pathToCSSFile, "utf-8");
      } catch (e) {
        return;
      }

      $(this).replaceWith('<style type="text/css">' + css + "</style>");
    });

    $('style[type="text/css"]').each(function() {
      if ($(this).attr("data-skip-inline")) {
        $(this).removeAttr("data-skip-inline");
        return;
      }
      // If the style tag is inside a <noscript> tag
      // then it is important that it doesn't move...
      if ($(this).parents("noscript").length) return;

      css += $(this).contents();

      $(this).remove();
    });

    try {
      var obj = parseCSS.parse(css);

      obj.stylesheet.rules = obj.stylesheet.rules.filter(function(rule) {
        if (rule.type !== "rule") return true;

        rule.selectors = rule.selectors.filter(function(selector) {
          // we need to skip font-face here...
          if (selector.indexOf("@font-face") > -1) return true;

          // I use some complex selectors to style these elements
          // which do not match although they should when I run
          // the document query below. 
          if (selector.indexOf('details') > - 1) return true;

          selector = selector
            .split(":focus")
            .join("")
            .split(":before")
            .join("")
            .split(":after")
            .join("")
            .split(":hover")
            .join("")
            .split(":active")
            .join("");

          var matches;

          try {
            matches = $(selector).length;
          } catch (e) {
            return false;
          }

          return matches > 0;
        });

        if (!rule.selectors.length) {
          return false;
        }

        return true;
      });

      css = parseCSS.stringify(obj);
      css = minimize.minify(css || "").styles;

      $("head").append('<style type="text/css">' + css + "</style>");

      html = $.html();
    } catch (e) {}

    send.call(this, html);
  };

  next();
};
