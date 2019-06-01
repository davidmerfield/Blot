// Recursively checks a URL for broken internal links. Will check
// the href= and src= attributes of any elements in the HTML response.

// I tried to use a third-party library for this at first but couldn't
// find anything which allowed custom HTTP readers with each request.
// This feature is neccessary to check the dashboard, with authentication.

// Calls back with an array of broken links in this format:
// [{
//   url:  the broken link's value, e.g. https://blot.im/XXX
//   base: the page on which the broken link was found
//   status: the HTTP status code returned for the broken link
// }]

var async = require("async");
var cheerio = require("cheerio");
var request = require("request");

function main(url, options, callback) {
  var checked = {};
  var results = {};

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
    var uri = { url: url, headers: options.headers || {} };

    request(uri, function(err, res, body) {
      if (err) return callback(err);

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

    async.eachSeries(
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

module.exports = main;
