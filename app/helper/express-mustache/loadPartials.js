const fs = require("fs-extra");
const load = require("./load");
const { join } = require("path");

const CACHED = {};

module.exports = async function loadPartials(root, options, ext, cache) {
  let partials = {};
  const dir = join(root, "partials");

  try {
    const items = cache
      ? CACHED[dir] || (await fs.readdir(dir))
      : await fs.readdir(dir);

    if (cache && !CACHED[dir]) CACHED[dir] = items;

    items
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

  return partials;
};
