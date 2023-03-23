const MAP = {
  page_size: {
    label: "Posts per page",
    min: 1,
    max: 60,
  },
};

module.exports = function (req, res, next) {
  
  res.locals.layouts = Object.keys(req.template.locals)

    // If the template uses the thumbnails per row
    // option then hide the page size option
    .filter((key) =>
      req.template.locals.thumbnails_per_row !== undefined
        ? key !== "page_size"
        : true
    )

    .filter(
      (key) =>
        [
          "page_size",
          "spacing_size",
          "spacing",
          "thumbnails_per_row",
          "number_of_rows",
        ].indexOf(key) > -1 ||
        (typeof req.template.locals[key] === "boolean" &&
          ["hide_dates"].indexOf(key) === -1) ||
        (key.indexOf("_range") === -1 &&
          req.template.locals[key + "_range"] &&
          req.template.locals[key + "_range"].constructor === Array) ||
        (key.indexOf("_options") === -1 &&
          req.template.locals[key + "_options"] &&
          req.template.locals[key + "_options"].constructor === Array)
    )
    .map((key) => {
      let min, max;

      let options = req.template.locals[key + "_options"];

      let isBoolean = typeof req.template.locals[key] === "boolean";

      let isRange =
        !isBoolean &&
        ([
          "page_size",
          "spacing_size",
          "spacing",
          "number_of_rows",
          "thumbnails_per_row",
        ].indexOf(key) > -1 ||
          req.template.locals[key + "_range"] !== undefined);

      let isSelect =
        !isRange && !isBoolean && options && options.constructor === Array;

      if (isSelect) {
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
        label: (MAP[key] && MAP[key].label) || desnake(key),
        value: req.template.locals[key],
        isRange,
        isBoolean,
        isSelect,
        options,
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
