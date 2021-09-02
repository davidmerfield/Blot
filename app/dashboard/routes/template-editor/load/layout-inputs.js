const MAP = {
  page_size: {
    label: "Posts per page",
    min: 1,
    max: 60,
  },
};

module.exports = function (req, res, next) {
  res.locals.partials.range = "template-editor/inputs/range";
  res.locals.partials.position = "template-editor/inputs/position";
  res.locals.partials.alignment = "template-editor/inputs/alignment";
  res.locals.layouts = Object.keys(req.template.locals)
    .filter(
      (key) =>
        ["page_size", "thumbnail_size", "spacing_size"].indexOf(key) > -1 ||
        (key.indexOf("_position") > -1 && key.indexOf("_options") === -1) ||
        (key.indexOf("_alignment") > -1 && key.indexOf("_options") === -1)
    )
    .map((key) => {
      let min, max;

      let options = req.template.locals[key + "_options"];

      let isRange =
        ["page_size", "thumbnail_size", "spacing_size"].indexOf(key) > -1;

      let isAlignment =
        !isRange &&
        key.indexOf("_alignment") > -1 &&
        options &&
        options.constructor === Array;

      let isPosition =
        !isRange &&
        !isAlignment &&
        key.indexOf("_position") > -1 &&
        options &&
        options.constructor === Array;

      if (isAlignment || isPosition) {
        options = req.template.locals[key + "_options"].map((option) => {
          return {
            label: desnake(option),
            selected: req.template.locals[key] === option ? "selected" : "",
            value: option,
          };
        });
      }

      if (isRange) {
        let range = req.template.locals[key + "_range"];
        min = (range && range[0]) || (MAP[key] && MAP[key].min) || 1;
        max = (range && range[1]) || (MAP[key] && MAP[key].max) || 60;
      }

      return {
        key,
        value: req.template.locals[key],
        isRange,
        options,
        isAlignment,
        isPosition,
        label: (MAP[key] && MAP[key].label) || desnake(key),
        max,
        min,
      };
    });

  return next();
};

function desnake(str) {
  str = str.split("_").join(" ");
  str = str[0].toUpperCase() + str.slice(1);
  return str;
}
