const Themes = require("blog/static/syntax-highlighter");
const font = require("./util/font");

module.exports = function (req, res, next) {
  if (!Object.keys(req.template.locals).includes("syntax_highlighter"))
    return next();

  res.locals.syntax_themes = {
    key: "syntax_highlighter",
    value: {
      ...(Themes.find(
        ({ id }) => id === req.template.locals.syntax_highlighter.id
      ) || {}),
      ...req.template.locals.syntax_highlighter
    },
    font: req.template.locals.syntax_highlighter_font
      ? font(
          "syntax_highlighter_font",
          req.template.locals.syntax_highlighter_font
        )
      : null,
    label: "Syntax Highlighter",
    options: Themes.map(option => {
      return {
        selected:
          req.template.locals.syntax_highlighter.id &&
          option.id === req.template.locals.syntax_highlighter.id
            ? "selected"
            : "",
        background: option.background,
        color: option.colors[0],
        colors: option.colors.slice(1).map(i => {
          return { color: i };
        }),
        tags: option.tags.map(tag => {
          return { tag };
        }),
        name: option.name,
        id: option.id
      };
    })
  };
  next();
};
