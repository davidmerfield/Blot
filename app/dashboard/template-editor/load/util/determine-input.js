const desnake = require("./desnake");

const MAP = {
  page_size: {
    label: "Posts per page",
    min: 1,
    max: 60
  }
};

module.exports = (key, locals) => {
  if (typeof locals[key] === "boolean") {
    return {
      key,
      label: desnake(key),
      value: locals[key],
      isBoolean: true
    };
  }

  if (locals[key + "_range"] !== undefined) {
    const range = locals[key + "_range"];

    const min = (range && range[0]) || (MAP[key] && MAP[key].min) || 1;
    const max = (range && range[1]) || (MAP[key] && MAP[key].max) || 60;

    return {
      key,
      label: desnake(key),
      value: locals[key],
      isRange: true,
      min,
      max
    };
  }

  if (
    locals[key + "_options"] !== undefined &&
    locals[key + "_options"].constructor === Array
  ) {
    const options = locals[key + "_options"].map(option => {
      return {
        label: desnake(option),
        selected: locals[key] === option ? "selected" : "",
        value: option
      };
    });

    return {
      key,
      label: desnake(key),
      value: locals[key],
      isSelect: true,
      options
    };
  }
};
