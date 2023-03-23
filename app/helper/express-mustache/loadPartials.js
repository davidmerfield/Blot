const fs = require("fs-extra");
const load = require("./load");
const { join } = require("path");

module.exports = async function loadPartials(root, options, ext, cache) {
  let partials = {};
  const dir = join(root, "partials");

  try {
    (await fs.readdir(dir))
      .filter((i) => i.endsWith(ext))
      .forEach(
        (i) => (partials[i.slice(0, i.lastIndexOf("."))] = join(dir, i))
      );
  } catch (e) {}

  if (options.partials) {
    partials = { ...partials, ...options.partials };
  }

  if (options.settings.partials) {
    partials = { ...partials, ...options.settings.partials };
  }

  for (const name in partials) {
    const res = await load(partials[name], ext, root, cache);
    partials[name] = res;
  }

  console.log("loaded partials", partials);

  return partials;
};
