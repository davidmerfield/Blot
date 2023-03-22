const fs = require("fs-extra");
const { extname, join } = require("path");
const mustache = require("mustache");

const cache = {};

const load = async function (path, options, ctx) {
  let template;

  if (!extname(path)) {
    path += ctx.ext;
  }

  path = ctx.lookup(path);

  if (!path) {
    return "";
  }

  template = cache[path];

  if (options.cache && template) {
    return template;
  }

  try {
    template = await fs.readFile(path, "utf8");
  } catch (err) {
    template = "";
  }

  if (options.cache) {
    cache[path] = template;
  }

  return template;
};

async function recursiveReaddir(dir, allFiles = []) {
  const files = (await fs.readdir(dir)).map((f) => join(dir, f));
  allFiles.push(...files);
  await Promise.all(
    files.map(
      async (f) =>
        (await fs.stat(f)).isDirectory() && recursiveReaddir(f, allFiles)
    )
  );
  return allFiles;
}

const loadPartials = async function (dir, ctx) {
  console.log("loading partials", dir);
  console.log("resolved dir to", dir);
  console.log("using ext", ctx.ext);

  const items = await fs.readdir(dir);
  const partials = {};

  items
    .filter((i) => i.endsWith(ctx.ext))
    .map((i) => i.slice(0, i.lastIndexOf(".")))
    .forEach((n) => (partials[n] = ""));

  return partials;
};

const render = async function (path, opt, callback) {
  // fs.ensureDirSync(VIEW_DIRECTORY);
  // fs.ensureDirSync(PARTIAL_DIRECTORY);

  var ctx = this;
  var partials = {};

  try {
    partials = await loadPartials(opt.settings.views + "/partials", ctx);
  } catch (e) {
    console.log("error loading partials", e);
  }

  if (opt.partials) {
    partials = { ...partials, ...opt.partials };
  }

  var template;
  var layout = opt.layout || opt.settings.layout;
  var body;

  try {
    for (const name in partials) {
      const res = await load("partials/" + name, opt, ctx);
      partials[name] = res;
    }

    if (layout) {
      template = await load(layout, opt, ctx);
      partials.body = await load(path, opt, ctx);
      body = path;
    } else {
      template = await load(path, opt, ctx);
    }

    const result = mustache.render(template, opt, partials);

    return callback(null, result);
  } catch (err) {
    if (err.message.indexOf(" at ") > -1) {
      const index = parseInt(err.message.split(" ").pop());
      console.log("INDEX is", index);
      console.log("SECTION::", template.slice(index - 10, index + 10));
    }
    const error = new Error(
      "Error rendering " +
        path.slice(opt.settings.views.length) +
        ": " +
        err.message
    );
    return callback(error);
  }
};

module.exports = render;

// documentation.use(function (req, res, next) {
//   const _render = res.render;
//   res.render = function (body_template) {
//     const body =
//       body_template || trimLeadingAndTrailingSlash(req.path) || "index.html";
//     const layout = res.locals.layout || PARTIAL_DIRECTORY + "/layout.html";

//     res.locals.partials = { body };

//     const partials = require("fs-extra")
//       .loaddirSync(PARTIAL_DIRECTORY)
//       .filter((i) => i.endsWith(".html"))
//       .map((i) => i.slice(0, i.lastIndexOf(".")));

//     partials.forEach(
//       (partial) => (res.locals.partials[partial] = `partials/${partial}.html`)
//     );

//     _render.call(this, layout, function (err, html) {
//       if (err) {
//         console.log("Render error:", err);
//         return res.req.next();
//       }
//       res.send(html);
//     });
//   };
//   next();
// });
