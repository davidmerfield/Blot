module.exports = function (req, res, next) {
  if (req.template.locals.color_schemes) {
    res.locals.color_schemes = Object.keys(req.template.locals.color_schemes)
      .filter((key) => key !== "custom")
      .map((key) => {
        let selected = true;
        let scheme = req.template.locals.color_schemes[key];

        if (!Object.keys(scheme).length) selected = false;

        for (let property in scheme) {
          if (req.template.locals[property] !== scheme[property])
            selected = false;
        }

        return {
          key,
          label: desnake(key),
          selected: selected ? "selected" : "",
        };
      });

    res.locals.color_schemes.unshift({
      key: "custom",
      label: "Custom",
      selected: res.locals.color_schemes.filter((i) => i.selected).length
        ? ""
        : "selected",
    });
  }

  return next();
};

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}
