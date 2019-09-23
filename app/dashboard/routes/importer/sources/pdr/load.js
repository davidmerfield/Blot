var cheerio = require("cheerio");
var request = require("request");
var fs = require("fs-extra");
var extract_article = require("./extract_article");
var for_each = require("../../helper").for_each;

if (require.main === module) {
  var output_file = process.argv[2];

  if (!output_file)
    throw new Error("Please pass filename to write links to as first argument");

  main(function(err, blog) {
    if (err) throw err;

    fs.outputJson(output_file, blog, { spaces: 2 }, function(err) {
      if (err) throw err;

      process.exit();
    });
  });
}

function main(callback) {
  var page_no = 1;

  // For some reason these show on the homepage but not the essay page
  // so we hard code them here for now...
  var articles = [
    "http://publicdomainreview.org/2018/04/04/fallen-angels-birds-of-paradise-in-early-modern-europe/",
    "http://publicdomainreview.org/2018/04/18/made-in-taiwan-how-a-frenchman-fooled-18th-century-london/"
  ];

  var base_url = "http://publicdomainreview.org/essays/page/";

  console.log("Retrieving articles...");

  request(base_url + page_no + "/", function then(err, res, body) {
    if (err) return callback(err);

    var has_more = false;
    var $ = cheerio.load(body, {
      // This prevent cheerio from replacing characters
      // it really ought to preserve.
      decodeEntities: false

      // Enabling XML mode has confusing effects
      // 1. It makes it hard to read certain non-standard
      //    tags that the evernote file contains, like <en-note>
      // 2. It allows us to read the contents of the <note> tags
      //    without manually removing the CDATA tags. So be
      //    careful if you remove this.
      // xmlMode: true
    });

    $("article").each(function(i, el) {
      articles.push(
        $(el)
          .find("a")
          .first()
          .attr("href")
      );
    });

    console.log("... Found", articles.length, "articles...");

    has_more =
      $(".link-last a")
        .text()
        .trim() === "Next »";

    if (has_more) return request(base_url + ++page_no + "/", then);

    console.log("Fetching article content...");

    var blog = {
      title: "Public Domain Review",
      host: "publicdomainreview.org",
      posts: []
    };

    var called = 0;
    var total = articles.length;

    for_each.multi(5)(
      articles,
      function(article_url, next) {
        console.log("...", ++called, "/", total, article_url);

        extract_article(article_url, function(err, title, content, html) {
          // third arg: meta

          blog.posts.push({
            title: title,
            content: content,
            html: html,
            url: article_url
          });

          next();
        });
      },
      function() {
        console.log("Done!");
        callback(null, blog);
      }
    );
  });
}

module.exports = main;
