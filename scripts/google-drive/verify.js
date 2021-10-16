const verify = require("clients/google-drive/util/verify");
const get = require("./get-blog");

get(async function (err, user, blog) {
  if (err) throw err;

  await verify(blog.id);

  console.log("verify!");

  process.exit();
});
