const Themes = require("blog/static/syntax-highlighter");

module.exports = function (req, res, next) {
  if (!req.locals.syntax_highlighter) return next();

  let match = Themes.find(({ id }) => req.locals.syntax_highlighter.id === id);

  if (!match) return next();

  for (let prop in match)
    req.locals.syntax_highlighter[prop] =
      req.locals.syntax_highlighter[prop] || match[prop];

  // we don't need these in the template
  delete req.locals.syntax_highlighter.background;
  delete req.locals.syntax_highlighter.tags;
  delete req.locals.syntax_highlighter.name;
  delete req.locals.syntax_highlighter.colors;

  next();
};
