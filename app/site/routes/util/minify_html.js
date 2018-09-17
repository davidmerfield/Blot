var html_minifier = require("html-minifier").minify;
var html_minifier_options = {
  removeComments: true,
  collapseWhitespace: true
};
module.exports = function(req, res, next) {
  var send = res.send;

  res.send = function(string) {
    var html = string instanceof Buffer ? string.toString() : string;

    // For some reason, calling res.render with HTML files does not set a Content-Type header
    // which is viewable here, even though it is sent to the browser. So we assumed undefined 
    // means HTML, which might not be true.
    // console.log('Content-Type', req.baseUrl + req.path, res.getHeader("Content-Type"));    
    if (res.getHeader('Content-Type') !== undefined && res.getHeader('Content-Type').indexOf('text/html') === -1) {
      return send.call(this, html);
    }

    try {
      html = html_minifier(html, html_minifier_options);
    } catch (e) {
      console.warn(
        "html_minifier: Could not minify HTML for",
        req.baseUrl + req.path
      );
    }

    send.call(this, html);
  };

  next();
};
