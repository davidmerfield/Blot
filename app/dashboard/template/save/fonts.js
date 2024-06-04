const FONTS = require("blog/static/fonts");
const Mustache = require("mustache");
const config = require("config");

module.exports = function (req, res, next) {
  for (let key in req.locals) {
    if (!key.includes("_font") && key !== "font") continue;

    let match = FONTS.slice().filter(({ id }) => req.locals[key].id === id)[0];

    if (match) {
      // always keep these in sync with the font model
      req.locals[key].stack = match.stack;
      req.locals[key].name = match.name;
      req.locals[key].styles = Mustache.render(match.styles, {
        config: {
          cdn: { origin: config.cdn.origin }
        }
      });

      // merge the new font object into the existing one
      for (let prop in match) {
        if (
          prop === "styles" ||
          prop === "name" ||
          prop === "stack" ||
          prop === "id" ||
          prop === "svg" ||
          prop === "tags"
        )
          continue;

        req.locals[key][prop] = req.locals[key][prop] || match[prop];
      }
    }
  }

  next();
};
