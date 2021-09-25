const colors = require("colors/safe");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const parseCSS = require("css");
const async = require("async");
const request = require("request");

request.defaults({
  strictSSL: false, // allow us to use our self-signed cert for testing
  rejectUnauthorized: false,
});

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // Avoids DEPTH_ZERO_SELF_SIGNED_CERT error for self-signed certs

const shouldSkip = (selector) => {
  let shouldSkip = false;

  ["@font-face", "@import", "working", "placeholder", "details"].forEach(
    (skippable) => {
      if (selector.indexOf(skippable) > -1) shouldSkip = true;
    }
  );

  return shouldSkip;
};

const normalizeSelector = (selector) => {
  [":focus-within", ":focus", ":before", ":after", ":hover", ":active"].forEach(
    (remove) => (selector = selector.split(remove).join(""))
  );

  selector = selector;

  return selector;
};

const CSS_DIR = require("path").resolve(
  "/",
  __dirname + "/../../app/brochure/views/css"
);

const CSS_FILES = ["blot.css", "breadcrumbs.css", "inputs.css", "sidebar.css"];

const CSS = CSS_FILES.map((filename) =>
  fs.readFileSync(CSS_DIR + "/" + filename, "utf-8")
);

const PARSED_CSS = CSS.map((css) => parseCSS.parse(css));

console.log("Crawling HTML on site...");

crawl(function (err, HTML) {
  if (err) throw err;

  const $ = cheerio.load(HTML);

  PARSED_CSS.forEach(function (obj, i) {
    obj.stylesheet.rules.forEach(function sortRules(rule) {
      // Recurse into the rules inside @media {} query blocks
      if (rule.type === "media") return rule.rules.forEach(sortRules);

      if (rule.type !== "rule") return;

      rule.selectors.forEach(function (selector) {
        try {
          if (shouldSkip(selector)) return;

          if ($(normalizeSelector(selector)).length > 0) return;
        } catch (e) {
          console.log(colors.red("Error: Possible BAD selector:", selector));
          console.log(e);
          return;
        }

        console.log();
        console.log(
          colors.red(selector),
          colors.dim("normalized=" + normalizeSelector(selector))
        );
        console.log(
          colors.dim(
            CSS_DIR + "/" + CSS_FILES[i] + ":" + rule.position.start.line
          )
        );
      });
    });
  });
});

function crawl(callback) {
  let res = "";
  let checked = {};

  checkPage(null, "https://blot.development", function (err) {
    if (err) return callback(err);
    callback(null, "<html><body>" + res + "</body></html");
  });

  // add some items to the queue
  function checkPage(base, url, callback) {
    const pathname = require("url").parse(url).pathname;

    if (checked[pathname]) return callback();

    checked[pathname] = true;

    const URL = require("url");
    const parsedURL = URL.parse(url);
    const extension = require("path").extname(parsedURL.pathname);
    const uri = { url: url };

    if (extension) {
      console.log(colors.yellow("SKIP", parsedURL.pathname));
      return callback();
    }

    console.log(colors.dim(" GET " + parsedURL.pathname));

    request(uri, function (err, response) {
      if (err) return callback(err);

      if (response.statusCode !== 200 && response.statusCode !== 400) {
        console.log(
          colors.red(" " + response.statusCode + " " + parsedURL.pathname)
        );
        return callback(
          new Error("Bad status: " + response.statusCode + " on " + url)
        );
      }

      if (
        response.headers["content-type"] &&
        response.headers["content-type"].indexOf("text/html") === -1
      ) {
        return callback();
      }

      let $;

      try {
        $ = cheerio.load(response.body);
      } catch (e) {
        return callback(e);
      }

      // THIS IS HTML!
      console.log(colors.green(" GOT " + parsedURL.pathname));
      res += $("body").html();

      parseURLs(url, $, callback);
    });
  }

  function parseURLs(base, $, callback) {
    let URLs = [];

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
