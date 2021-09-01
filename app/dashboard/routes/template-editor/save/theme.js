module.exports = function (req, res, next) {
  if (req.locals.theme) {
    let theme = req.locals.theme;
    delete req.locals.theme;

    if (req.template.locals.themes && req.template.locals.themes[theme]) {
      for (let property in req.template.locals.themes[theme]) {
        // store the old value in the custom field if neccessary
        req.locals.themes.custom = req.template.locals.themes.custom || {};
        req.locals.themes.custom[property] = req.template.locals[property];

        req.locals[property] = req.template.locals.themes[theme][property];

        console.log(req.template.locals.themes[theme][property]);
      }
    }
  }

  next();
};
