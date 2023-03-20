const reset = require("clients/dropbox/sync/reset-from-blot");
const get = require("../get/blog");

get(process.argv[2], async function (err, user, blog) {
  if (err) throw err;

  console.log("Resetting folder from Blot to Dropbox");
  await reset(blog.id);
  console.log("Resetting folder from Blot to Dropbox");

  process.exit();
});
