const mustache = require("mustache");
const fs = require("fs-extra");
const config = require("config");

module.exports = function ({ views, partials }) {
  let loadedPartials = {};

  const loadPartial = (partial) => {
    let name = partial.slice(0, partial.indexOf("."));
    let value = fs.readFileSync(partials + "/" + partial, "utf-8");
    try {
      mustache.parse(value);
    } catch (e) {
      console.error("Error loading partial:", name);
      console.error("File:", partials + "/" + partial);
      console.error("Message:", e.message);

      if (config.environment !== "development") {
        return (loadedPartials[name] = "Error");
      } else {
        loadedPartials[
          name
        ] = `<h1>For developers only: error loading partial</h1>
      <h2>File: ${partial}</h2>
      <pre>${e.message}</pre>`;
      }
    }

    loadedPartials[name] = value;
  };

  if (!config.cache) {
    fs.watch(partials, { recursive: true }, (type, partial) =>
      loadPartial(partial)
    );
  }

  fs.readdirSync(partials).forEach(loadPartial);

  return function middleware(filename, options, callback) {
    let result = "";
    let template;

    const contents = fs.readFileSync(filename, "utf-8");

    if (options.layout) {
      template = fs.readFileSync(
        views + "/" + options.layout + ".html",
        "utf-8"
      );
      loadedPartials.body = contents;
    } else {
      template = contents;
    }

    try {
      result = mustache.render(template, options, loadedPartials);
    } catch (e) {
      let message = `Error rendering ${filename}
      ${e.message}`;
      let error = new Error(message);
      return callback(error);
    }

    callback(null, result);
  };
};
