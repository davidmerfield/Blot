const FONTS = require("blog/static/fonts");
const Mustache = require("mustache");
const config = require("config");
const SYNTAX_HIGHLIGHTER_THEMES = require("blog/static/syntax-highlighter");

module.exports = (locals) => {

    console.log("locals", locals);

  // handle fonts
  for (let key in locals) {
    if (!key.includes("_font") && key !== "font") continue;

    console.log("key", key);

    let match = FONTS.slice().filter(({ id }) => locals[key].id === id)[0];

    if (match) {

        console.log("match", match);

      // always keep these in sync with the font model
      locals[key].stack = match.stack;
      locals[key].name = match.name;
      locals[key].styles = Mustache.render(match.styles, {
        config: {
          cdn: { origin: config.cdn.origin },
        },
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

        locals[key][prop] = locals[key][prop] || match[prop];
      }

      console.log("locals[key]", locals[key]);
    } else {
        console.log("no match for font", locals[key].id);
    }
  }

  // handle syntax highlighter
  for (let key in locals) {
    if (!key.includes("_syntax_highlighter") && key !== "syntax_highlighter")
      continue;

    let match = SYNTAX_HIGHLIGHTER_THEMES.find(
      ({ id }) => locals.syntax_highlighter.id === id
    );

    if (!match) continue;

    for (let prop in match)
      locals.syntax_highlighter[prop] =
        locals.syntax_highlighter[prop] || match[prop];

    // we don't need these in the template
    delete locals.syntax_highlighter.background;
    delete locals.syntax_highlighter.tags;
    delete locals.syntax_highlighter.name;
    delete locals.syntax_highlighter.colors;
  }

};
