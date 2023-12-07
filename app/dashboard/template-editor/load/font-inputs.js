const font = require("./util/font");

module.exports = function (req, res, next) {
  res.locals.fonts = Object.keys(req.template.locals)
    .filter(key => key.indexOf("_font") > -1)
    .map(key => font(key, req.template.locals[key]));

  return next();
};
