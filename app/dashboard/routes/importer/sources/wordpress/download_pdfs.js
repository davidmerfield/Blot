var cheerio = require("cheerio");
var basename = require("path").basename;
var parse = require("url").parse;
var download = require("download");
var helper = require("../../helper");
var each_el = helper.each_el;
var fs = require("fs-extra");

module.exports = function download_pdfs(post, callback) {
  var changes = false;

  // if (post.html.indexOf('pdf-embedder') > -1) {
  //   console.log('<<- ', post.html, ' ->>');
  //   throw new Error();
  // }

  var reg = /\[pdf-embedder(.*)\]/gm;

  post.html = post.html.replace(reg, function(str, x) {
    if (x.indexOf("url=")) x = x.split("url=").join("href=");

    return "\n\n<a" + x + ">PDF</a>\n\n";
  });

  // post.html = post.html.split('\\[pdf-embedder url="').join('\n\n<a href="');
  // post.html = post.html.split('"\\]').join("</a>\n\n");

  var $ = cheerio.load(post.html, { decodeEntities: false });

  each_el(
    $,
    "a",
    function(el, next) {
      var href = $(el).attr("href");
      var name;

      try {
        name = nameFrom(href);
      } catch (e) {
        return next();
      }

      if (name.charAt(0) !== "_") name = "_" + name;

      if (require("path").extname(href) !== ".pdf") return next();

      download(href)
        .then(function(data) {
          fs.outputFile(post.path + "/" + name, data, function(err) {
            if (err) return next();

            if ($(el).text() === href) {
              $(el).text(name);
            }

            changes = true;

            $(el).attr("href", name);

            next();
          });
        })
        .catch(function(err) {
          console.log("PDF error", href, err);
          return next();
        });
    },
    function() {
      if (changes) {
        post.path = post.path + "/post.txt";
      }
      post.html = $.html();
      callback(null, post);
    }
  );
};

function nameFrom(src) {
  return "_" + basename(parse(src).pathname);
}
