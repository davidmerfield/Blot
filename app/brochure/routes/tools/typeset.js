var Typeset = require("typeset");

module.exports = function typeset(req, res, next) {
  var send = res.send;

  res.send = function (string) {
    req.trace('Starting typeset');
    var html = string instanceof Buffer ? string.toString() : string;

    html = Typeset(html, { disable: ["hyphenate"], ignore: "textarea, input" });

    req.trace('finished typeset');
    send.call(this, html);
  };

  next();
};
