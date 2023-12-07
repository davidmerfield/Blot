const FONTS = require("blog/static/fonts");

module.exports = function (req, res, next) {
  res.locals.fonts = Object.keys(req.template.locals)
    .filter((key) => key.indexOf("_font") > -1)
    .map((key) => {
      return {
        key,
        options: FONTS.map((option) => {
          return {
            tags: option.tags.map((i) => {
              return { tag: i };
            }),
            selected:
              req.template.locals[key].id &&
              option.id === req.template.locals[key].id
                ? "selected"
                : "",
            name: option.name,
            svg: option.svg,
            stack: option.stack,
            id: option.id,
          };
        }),
        font_size: req.template.locals[key].font_size || 16,
        line_height: req.template.locals[key].line_height || 1.4,
        value: {
          ...(FONTS.find(({ id }) => id === req.template.locals[key].id) || {}),
          ...req.template.locals[key],
        },
        label: desnake(key),
      };
    });

  return next();
};

// function (req, res, next) {
//  let fontChanges =

//  if (changes.)

//  return next()
// }

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  if (str === "Body font") str = "Font";
  return str;
}
