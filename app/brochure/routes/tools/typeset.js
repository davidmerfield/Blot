var Typeset = require("typeset");

module.exports = function typeset(req, res, next) {
  var send = res.send;

  res.send = function(string) {
    var html = string instanceof Buffer ? string.toString() : string;

    html = Typeset(html, { disable: ["hyphenate"] });

    send.call(this, html);
  };

  next();
};
