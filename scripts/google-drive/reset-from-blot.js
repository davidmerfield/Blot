const reset = require("clients/google-drive/sync/reset-from-blot");
const get = require("../get/blog");

get(process.argv[2], async function (err, user, blog) {
  if (err) throw err;

  console.log("Resetting folder from Blot to Google Drive");
  await reset(blog.id);
  console.log("Resetting folder from Blot to Google Drive");

  process.exit();
});
