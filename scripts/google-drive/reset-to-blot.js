const reset = require("clients/google-drive/sync/reset-to-blot");
const get = require("../get/blog");

get(process.argv[2], async function (err, user, blog) {
  if (err) throw err;

  console.log("Resetting folder from Google Drive to Blot");
  await reset(blog.id);
  console.log("Resetting folder from Google Drive to Blot");

  process.exit();
});
