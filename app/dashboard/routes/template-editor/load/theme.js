module.exports = function (req, res, next) {
  if (req.template.locals.themes) {
    res.locals.themes = Object.keys(req.template.locals.themes).map((key) => {
      let selected = true;
      let theme = req.template.locals.themes[key];

      if (!Object.keys(theme).length) selected = false;

      for (let property in theme) {
        // console.log("property", property);
        // console.log(" - template: ", req.template.locals[property]);
        // console.log(" - theme: ", theme[property]);

        if (req.template.locals[property] !== theme[property]) selected = false;
      }

      return {
        key,
        label: desnake(key),
        selected: selected ? "selected" : "",
      };
    });

    if (res.locals.themes.filter((i) => i.key === "custom").length === 0) {
      res.locals.themes.unshift({
        key: "custom",
        label: "Custom",
        selected: res.locals.themes.filter((i) => i.selected).length
          ? ""
          : "selected",
      });
    }
  }

  return next();
};

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}
