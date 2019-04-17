var minify = require('html-minifier').minify;

module.exports = function render_tex (req, res, next) {

  var send = res.send;

  res.send = function (string) {

    var html = string instanceof Buffer ? string.toString() : string;

    html = minify(html, {
      collapseWhitespace: true,
      removeComments: true
    });

    send.call(this, html);
  };

  next();  
};

