const fs = require("fs-extra");
const { extname } = require("path");
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

const render = async function (path, opt, callback) {
  console.log("HERE", path, opt);

  var partials;
  var ctx = this;

  partials = opt.settings.partials || {};

  if (opt.partials) {
    partials = { ...partials, ...opt.partials };
  }

  try {
    for (const name in partials) {
      partials[name] = await load(partials[name], opt, ctx);
    }

    var layout = opt.layout || opt.settings.layout;
    var template;

    if (layout) {
      template = await load(layout, opt, ctx);
      partials.body = await load(path, opt, ctx);
    } else {
      template = await load(path, opt, ctx);
    }

    const result = mustache.render(template, opt, partials);

    // if (layout) {
    //   opt.yield = result;
    //   tmpl = hogan.compile(layout, opt);
    //   result = tmpl.render(opt, partials);
    //   return fn(null, result);
    // }
    return callback(null, result);
  } catch (err) {
    return callback(err);
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
