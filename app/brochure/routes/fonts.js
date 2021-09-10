const Express = require("express");
const fonts = new Express.Router();
const config = require("config");
const Mustache = require("mustache");

const FONTS = require("blog/static/fonts").map((font) => {
  font.styles = Mustache.render(font.styles, {
    config: {
      cdn: { origin: config.cdn.origin },
    },
  });
  return font;
});

fonts.get("/", function (req, res) {
  res.locals.fonts = FONTS;
  res.render("fonts");
});

module.exports = fonts;
