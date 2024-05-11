const font = require("./util/font");

module.exports = function (req, res, next) {
  res.locals.fonts = Object.keys(req.template.locals)
    .filter(key => key.indexOf("_font") > -1 || key === "font")
    .filter(key => key !== "syntax_highlighter_font")
    .map(key => font(key, req.template.locals[key]));

  return next();
};
