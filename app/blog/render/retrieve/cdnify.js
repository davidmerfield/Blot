/* 

This function accepts some HTML and will resolve any relative
URLs against the host for the particular request. This is only
used in a site's RSS feed and should eventually be deprecated,
probably, since it's expensive to do this at render time.

For example, assuming the request is served from 'example.com'
over HTTPS, this lambda will transform:
<img src="/_thumbnail/foo.png">    -->   <img src="https://blotcdn.com/dev//_thumbnail/foo.png">
It checks anything with an 'src' attribute

Use it like this:
{{#absoluteURLs}}
  {{{entry.html}}}
{{/absoluteURLs}}

*/

var cheerio = require("cheerio");
var debug = require("debug")("blot:render:cdnify");
var config = require("config");

function resolve($, base) {
  return function() {
    var src = $(this).attr("src");

    if (src && src[0] === "/") {
      $(this).attr("src", base + src);
    }
  };
}

module.exports = function cdnify (req, callback) {
  return callback(null, function() {
    return function(text, render) {
      var $;
      var base = req.protocol + "://" + config.cdn.host + "/" + req.blog.handle;

      text = render(text);

      try {
        $ = cheerio.load(text);
        $("[src]").each(resolve($, base));
        text = $.html();
      } catch (e) {
        debug(e);
      }

      return text;
    };
  });
};
