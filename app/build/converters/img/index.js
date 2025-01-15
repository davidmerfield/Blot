const fs = require("fs");
const { extname, dirname, join, basename } = require("path");
const titlify = require("build/prepare/titlify");
const ensure = require("helper/ensure");
const LocalPath = require("helper/localPath");

const SUPPORTED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".gif"];

function is(path) {
  return SUPPORTED_EXTENSIONS.includes(extname(path).toLowerCase());
}

function read(blog, path, options, callback) {
  ensure(blog, "object")
    .and(path, "string")
    .and(options, "object")
    .and(callback, "function");

  const localPath = LocalPath(blog.id, path);

  fs.stat(localPath, (err, stat) => {
    if (err) return callback(err);

    const name = options.name || basename(path);
    const pathForTitle = options.pathDisplay || join(dirname(path), name);
    const title = titlify(pathForTitle);
    const isRetina = path.toLowerCase().includes("@2x") ? 'data-2x="true"' : "";

    const contents = `<img src="${encodeURI(path)}" title="${title}" alt="${title}" ${isRetina}/>`;
    
    callback(null, contents, stat);
  });
}

module.exports = { is, read, id: "img" };
