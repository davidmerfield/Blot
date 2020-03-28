var cheerio = require("cheerio");
var request = require("request");

module.exports = function load(feed_url, callback) {
  if (!callback) throw new Error("Please pass a callback");

  if (!feed_url) return callback(new Error("Please pass a URL to an RSS feed"));

  request(feed_url, function(err, res, body) {
    if (err) return callback(err);

    var $ = cheerio.load(body, {
      // This prevent cheerio from replacing characters
      // it really ought to preserve.
      decodeEntities: false,

      // Enabling XML mode has confusing effects
      // 1. It makes it hard to read certain non-standard
      //    tags that the evernote file contains, like <en-note>
      // 2. It allows us to read the contents of the <note> tags
      //    without manually removing the CDATA tags. So be
      //    careful if you remove this.
      xmlMode: true
    });

    callback(null, $);
  });
};
