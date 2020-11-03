/* 

This function will adjust the rendered HTML for each image 
tag inside a blog post's HTML and BODY and TEASER

Use it like this:

{{#entry}}
	
	{{! The template used to render any images in the post}}
	{{#imageFormat}}
	<img src="{{{url}}}" width="{{width}}">
	{{/imageFormat}}
	
	{{! Where the result appears}}
	{{{html}}}

{{/entry}}

*/

var cheerio = require("cheerio");
var debug = require("debug")("blot:render:imageFormat");

function absoluteURLs(base, $) {
  try {
    $("img").each(function() {
      var src = $(this).attr("src");
      var result = 
     $(this).replaceWith(result)
    });
  } catch (e) {
    debug(e);
  }

  return $;
}

module.exports = function(req, callback) {
  return callback(null, function() {
    return function(text, render) {
      var base = req.protocol + "://" + req.get("host");

      text = render(text);

      var $ = cheerio.load(text);

      text = absoluteURLs(base, $);
      text = $.html();

      return text;
    };
  });
};

// We also want to use this function in encodeXML
// so we export it without the callback wrapper.
module.exports.absoluteURLs = absoluteURLs;
