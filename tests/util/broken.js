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
const async = require("async");
const cheerio = require("cheerio");
const request = require("request");

function main(url, options, callback) {
  let checked = {};
  let results = {};
  let failures = {};

  if (callback === undefined && typeof options === "function") {
    callback = options;
    options = {};
  }

  checkPage(null, url, function (err) {
    if (err) return callback(err);
    callback(null, results);
  });

  function addFailure(base, url, statusCode) {
    const basePath = require("url").parse(base).pathname;
    const pathname = require("url").parse(url).pathname;
    failures[pathname] = statusCode;
    results[basePath] = results[basePath] || [];
    results[basePath].push([require("url").parse(url).pathname, statusCode]);
  }

  // add some items to the queue
  function checkPage(base, url, callback) {
    const pathname = require("url").parse(url).pathname;

    if (failures[pathname]) {
      addFailure(base, url, failures[pathname]);
      return callback();
    }

    if (checked[pathname]) return callback();

    checked[pathname] = true;

    const URL = require("url");
    const parsedURL = URL.parse(url);
    const extension = require("path").extname(parsedURL.pathname);
    const uri = { url: url, headers: options.headers || {} };

    if (extension) {
      console.log("skipping", url);
      return callback();
    }

    console.log("requesting", url);

    request(uri, function (err, res, body) {
      if (err) return callback(err);

      // We use 400 sometimes on the dashboard
      if (res.statusCode !== 200 && res.statusCode !== 400) {
        console.log("ERROR!", res.statusCode, url);
        addFailure(base, url, res.statusCode);
      }

      if (
        res.headers["content-type"] &&
        res.headers["content-type"].indexOf("text/html") === -1
      ) {
        return callback();
      }

      parseURLs(url, body, callback);
    });
  }

  function parseURLs(base, body, callback) {
    let URLs = [];
    let $;

    try {
      $ = cheerio.load(body);
    } catch (e) {
      return callback(e);
    }

    $("[href],[src]").each(function () {
      let url = $(this).attr("href") || $(this).attr("src");

      if (!url) return;

      url = require("url").resolve(base, url);

      if (require("url").parse(url).host !== require("url").parse(base).host)
        return;

      URLs.push(url);
    });

    async.eachSeries(
      URLs,
      function (url, next) {
        checkPage(base, url, next);
      },
      callback
    );
  }
}

module.exports = main;
