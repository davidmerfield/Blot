var async = require("async");
var cheerio = require("cheerio");
var request = require("request");
var debug = require("debug")("blot:tests:broken-link-checker");

function main(url, options, callback) {
  var checked = {};
  var results = [];

  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  checkPage(null, url, function(err) {
    if (err) return callback(err);
    callback(null, results);
  });

  // add some items to the queue
  function checkPage(base, url, callback) {
    request(url, function(err, res, body) {
      if (err) return callback(err);

      if (res.statusCode !== 200)
        results.push({ url: url, status: res.statusCode, base: base });

      if (res.headers["content-type"].indexOf("text/html") === -1) {
        return callback();
      }

      parseURLs(url, body, callback);
    });
  }

  function parseURLs(base, body, callback) {
    var URLs = [];
    var $;

    try {
      $ = cheerio.load(body);
    } catch (e) {
      return callback(e);
    }

    $("[href],[src]").each(function() {
      var url = $(this).attr("href") || $(this).attr("src");
      url = require("url").resolve(base, url);

      if (require("url").parse(url).host !== require("url").parse(base).host)
        return;

      URLs.push(url);
    });

    async.each(
      URLs,
      function(url, next) {
        if (checked[url]) return next();

        checked[url] = true;

        checkPage(base, url, next);
      },
      callback
    );
  }
}

if (require.main === module)
  main(process.argv[2], {}, function(err, results) {
    if (err) throw err;
    console.log(results);
    process.exit();
  });

module.exports = main;
