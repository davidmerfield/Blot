/* 

This function accepts some HTML makes it suitable for 
inclusion in a CDATA-fenced description tag for an RSS
feed item. It resolves relative URLs to make the result
more portable. It should help produce valid feeds.
*/

var absoluteURLs = require('./absoluteURLs').absoluteURLs;

function removeXMLInvalidChars(string) {
  // remove everything forbidden by XML 1.0 specifications, plus the unicode replacement character U+FFFD
  var regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g;

  string = string.replace(regex, "");

  // removes everything not suggested by XML 1.0 specifications
  // regex = new RegExp(
  //   "([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF" +
  //     "FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD" +
  //     "FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])" +
  //     "|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\" +
  //     "uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF" +
  //     "[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\" +
  //     "uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|" +
  //     "(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))",
  //   "g"
  // );
  // string = string.replace(regex, "");

  return string;
}

module.exports = function (req, callback) {
  return callback(null, function() {
    return function(text, render) {
      var xml;
      
      text = render(text);
      
      try {
        xml = absoluteURLs(req.protocol + "://" + req.get("host"), text);
        xml = removeXMLInvalidChars(text);        
      } catch (e) {
        // do nothing if we can't 
      }

      return xml || text;
    };
  });
};
