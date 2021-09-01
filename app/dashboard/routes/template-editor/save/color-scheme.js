const _ = require("lodash");

module.exports = function (req, res, next) {
  // the user has clicked on a button in the 'color scheme' list
  if (req.locals.color_scheme) {
    let newTheme = req.locals.color_scheme;

    if (
      req.template.locals.color_schemes &&
      req.template.locals.color_schemes[newTheme]
    ) {
      let oldState = {};
      let newState = {};

      for (let property in req.template.locals.color_schemes[newTheme]) {
        newState[property] =
          req.template.locals.color_schemes[newTheme][property];
        oldState[property] = req.template.locals[property];
      }

      // reset memory of custom scheme
      if (newTheme === "custom") {
        req.locals.color_schemes.custom = {};
      }

      let oldStateWasNotTheme =
        Object.keys(req.template.locals.color_schemes).filter((color_scheme) =>
          _.isEqual(req.template.locals.color_schemes[color_scheme], oldState)
        ).length === 0;

      // // store the old value in the custom field if neccessary
      if (oldStateWasNotTheme) {
        req.locals.color_schemes.custom =
          req.template.locals.color_schemes.custom || {};
        req.locals.color_schemes.custom = oldState;
      }

      // store new state of color scheme
      for (let property in newState) req.locals[property] = newState[property];
    }

    delete req.locals.color_scheme;
  }

  next();
};
