const _ = require("lodash");

module.exports = function (req, res, next) {
  // the user has clicked on a button in the 'color scheme' list
  if (req.locals.theme) {
    let newTheme = req.locals.theme;

    if (req.template.locals.themes && req.template.locals.themes[newTheme]) {
      let oldState = {};
      let newState = {};

      for (let property in req.template.locals.themes[newTheme]) {
        newState[property] = req.template.locals.themes[newTheme][property];
        oldState[property] = req.template.locals[property];
      }

      // reset memory of custom scheme
      if (newTheme === "custom") {
        req.locals.themes.custom = {};
      }

      let oldStateWasNotTheme =
        Object.keys(req.template.locals.themes).filter((theme) =>
          _.isEqual(req.template.locals.themes[theme], oldState)
        ).length === 0;

      // // store the old value in the custom field if neccessary
      if (oldStateWasNotTheme) {
        req.locals.themes.custom = req.template.locals.themes.custom || {};
        req.locals.themes.custom = oldState;
      }

      // store new state of color scheme
      for (let property in newState) req.locals[property] = newState[property];
    }

    delete req.locals.theme;
  }

  next();
};
