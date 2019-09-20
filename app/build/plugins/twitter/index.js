var config = require("config");
var each = require("../eachEl");
var Url = require("url");

var Twit = require("twit");
var Twitter;
var SCRIPT =
  '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>';

if (!process.env.BLOT_TWITTER_CONSUMER_KEY) {
  console.log(
    "Warning: Please get twitter credentials and pass them as environment variables"
  );
  return (module.exports = {});
}

try {
  Twitter = new Twit({
    consumer_key: process.env.BLOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.BLOT_TWITTER_CONSUMER_SECRET,
    access_token: process.env.BLOT_TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.BLOT_TWITTER_ACCESS_TOKEN_SECRET
  });
} catch (e) {
  console.log(
    "Warning: Please get twitter credentials and pass them as environment variables"
  );
  return (module.exports = {});
}

function render($, callback) {
  var prepend;

  each(
    $,
    "a",
    function(el, next) {
      var href, host, text, id;

      try {
        href = $(el).attr("href");
        text = $(el).text();

        host = Url.parse(href).host;
        id = parseID(href);
      } catch (e) {
        return next();
      }

      // Ensure we managed to extract everything from the url
      if (!href || !text || !id || !host) return next();

      // Look for bare links
      if (href !== text) return next();

      // which point to twitter.com
      if (host !== "twitter.com") return next();

      var params = {
        id: id,
        hide_thread: true
      };

      Twitter.get("statuses/oembed", params, function(err, data) {
        if (err || !data || !data.html) return callback();

        var html = data.html;

        if (html.indexOf(SCRIPT) > -1) {
          html = html.split(SCRIPT).join("");
          $(el).replaceWith(html);
          prepend = true;
        } else {
          console.warn("Response from twitter no longer includes script tag");
        }

        next();
      });
    },
    function() {
      // Now we add the script tag if needed
      if (prepend) $.root().prepend(SCRIPT);

      callback();
    }
  );
}

function parseID(url) {
  var path, paths, tweetID, category;

  path = Url.parse(url).pathname;

  // Trim trailing slash if applicable
  if (path.slice(-1) === "/") path = path.slice(0, -1);

  // map /USER/status/123 -> ['USER', 'status', '123']
  paths = path.split("/");

  tweetID = paths.pop();
  category = paths.pop().toLowerCase();

  // Not a twitter status
  if (category !== "status") return "";

  return tweetID;
}

module.exports = {
  render: render,
  category: "external",
  title: "Tweets",
  description: "Embed tweets from Twitter URLs"
};
