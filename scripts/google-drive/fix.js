const fix = require("clients/google-drive/util/fix");
const get = require("./get-blog");
const { promisify } = require("util");
const fixBlog = promisify(require("sync/fix"));

get(async function (err, user, blog) {
  if (err) throw err;

  // google drive
  await fix(blog.id);

  // blot posts, files, etc.
  await fixBlog(blog);

  process.exit();
});
