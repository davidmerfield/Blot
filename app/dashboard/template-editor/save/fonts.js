const FONTS = require("blog/static/fonts");
const Mustache = require("mustache");
const config = require("config");

module.exports = function (req, res, next) {
  for (let key in req.locals) {
    if (key.indexOf("_font") === -1) continue;
    let match = FONTS.slice().filter(({ id }) => req.locals[key].id === id)[0];

    if (match) {
      match.styles = Mustache.render(match.styles, {
        config: {
          cdn: { origin: config.cdn.origin },
        },
      });
      for (let prop in match)
        req.locals[key][prop] = req.locals[key][prop] || match[prop];

      // we don't need these in the template
      delete req.locals[key].svg;
      delete req.locals[key].tags;
    }
  }

  next();
};
