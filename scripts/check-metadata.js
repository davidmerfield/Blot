const get = require("./get/blog");
const build = require("build");
const localPath = require("helper/localPath");
const fs = require("fs-extra");
const async = require("async");

const { resolve } = require("path");
const { readdir } = require("fs").promises;

let result = {};

async function getFiles(dir) {
  const dirents = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirents.map((dirent) => {
      const res = resolve(dir, dirent.name);
      return dirent.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

get(process.argv[2], async function (err, blog) {
  const paths = await getFiles(process.argv[3]);
  async.eachSeries(
    paths,
    (path, next) => {
      const relativePath = path.slice(process.argv[3].length);
      fs.copySync(path, localPath(blog.id, relativePath));
      build(blog, relativePath, (err, entry) => {
        next();
      });
    },
    (err) => {
      fs.outputJSONSync("result.json", result);
      process.exit();
    }
  );
});
