const Themes = require("blog/static/syntax-highlighter");

module.exports = function (req, res, next) {
  if (!Object.keys(req.template.locals).includes("syntax_highlighter"))
    return next();

  res.locals.syntax_themes = {
    key: "syntax_highlighter",
    value: req.template.locals.syntax_highlighter,
    label: "Syntax Highlighter",
    options: Themes.map((option) => {
      return {
        selected:
          req.template.locals.syntax_highlighter.id &&
          option.id === req.template.locals.syntax_highlighter.id
            ? "selected"
            : "",
        name: option.name,
        id: option.id,
      };
    }),
  };
  next();
};
