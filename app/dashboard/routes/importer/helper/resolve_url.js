var cheerio = require("cheerio");
var url = require("url");

module.exports = function resolve_url(blog_url, html) {
  var $ = cheerio.load(html, { decodeEntities: false });
  var href, src;

  // This matches css
  $("[href]").each(function() {
    href = $(this).attr("href");
    // console.log('before', href);
    href = url.resolve(blog_url, href);
    // console.log('after', href);
    $(this).attr("href", href);
  });

  // This matches js, images video etc..
  $("[src]").each(function() {
    src = $(this).attr("src");
    // console.log('before', src);
    src = url.resolve(blog_url, src);
    // console.log('after', src);
    $(this).attr("src", src);
  });

  return $.html();
};
