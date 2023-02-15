const reset = require("clients/dropbox/sync/reset-to-blot");
const get = require("../get/blog");

get(process.argv[2], async function (err, user, blog) {
  if (err) throw err;

  console.log("Resetting folder from Dropbox to Blot!");
  await reset(blog.id);
  console.log("Reset folder from Dropbox to Blot!");

  process.exit();
});
