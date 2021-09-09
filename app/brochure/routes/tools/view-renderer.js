const mustache = require("mustache");
const fs = require("fs-extra");
const config = require("config");

let VIEW_CACHE = {};

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
      <pre>${e.stack.toString()}</pre>`;
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

    if (VIEW_CACHE[filename]) {
      template = VIEW_CACHE[filename];
    } else {
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
    }

    try {
      result = mustache.render(template, options, loadedPartials);

      // console.log(builtTemplatePath, builtTemplate.slice(0, 100));

      // fs.outputFileSync(builtTemplatePath, builtTemplate, "utf-8");
    } catch (e) {
      console.log(e);
      if (config.environment === "development") {
        result = `<h1>For developers only: error rendering</h1>
      <h2>Filename: ${filename}</h2>
      <pre>${e.stack.toString()}</pre>`;
      }
    }

    callback(null, result);

    let builtTemplate = template;

    // let builtTemplatePath = views + "_built/" + filename.slice(views.length);

    // this won't render partials in partials
    Object.keys(loadedPartials).forEach((partialName) => {
      builtTemplate = builtTemplate
        .split("{{> " + partialName + "}}")
        .join(loadedPartials[partialName]);
    });

    builtTemplate = require("./inline-css").action(builtTemplate);
    builtTemplate = require("./typeset").action(builtTemplate);
    builtTemplate = require("./minify-html").action(builtTemplate);
    mustache.parse(builtTemplate);

    VIEW_CACHE[filename] = builtTemplate;
  };
};
