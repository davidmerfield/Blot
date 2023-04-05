const fs = require("fs-extra");
const { extname, resolve } = require("path");

module.exports = async function load(path, ext, root, cache) {
  const extension = extname(path);
  const resolvedPath = resolve(path);
  const resolvedRoot = resolve(root);

  if (!extension) {
    path += ext;
  }

  // maps path='index.html' root='/views' to '/views/index.html'
  if (!resolvedPath.startsWith(resolvedRoot)) {
    path = resolve(root, path);
  }

  let template = "";

  if (cache) {
    template = cache[path];
  }

  if (template) {
    return template;
  }

  try {
    template = await fs.readFile(path, "utf8");
    cache[path] = template;
  } catch (err) {}

  return template;
};
