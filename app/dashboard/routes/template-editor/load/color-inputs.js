module.exports = function (req, res, next) {
  res.locals.partials.color = "template-editor/inputs/color";
  res.locals.colors = Object.keys(req.template.locals)
    .filter((key) => key.indexOf("_color") > -1)
    .map((key) => {
      return { key, value: req.template.locals[key], label: desnake(key) };
    });

  return next();
};

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}
