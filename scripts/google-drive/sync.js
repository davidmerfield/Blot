const sync = require("clients/google-drive/sync");
const get = require("./get-blog");

get(function (err, user, blog) {
  if (err) throw err;

  const options = { fromScratch: false };

  sync(blog.id, options, function then(err) {
    if (err) throw err;

    console.log("Synced!");

    if (process.argv[2] === "-c") {
      console.log("Syncing again in 1s.");
      return setTimeout(() => sync(blog.id, options, then), 1000);
    }

    process.exit();
  });
});
