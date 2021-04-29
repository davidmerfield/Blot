const each = require("./each/entry");
const localPath = require("helper/localPath");
const TMP = require("helper/tempDir")() + "/thousand";
const fs = require("fs-extra");
const join = require("path").join;

let total = 0;

each(
  (user, blog, entry, next) => {
    if (total > 1000) return next();
    // 1 in 100 files
    if (Math.floor(Math.random() * 100) > 1) return next();
    total++;
    const from = localPath(blog.id, entry.id);
    const to = join(TMP, entry.id);
    console.log(blog.id, entry.id)
    fs.copy(from, to, next);
  },
  (err) => {
    console.log("done! wrote result to", TMP);
    process.exit();
  }
);
