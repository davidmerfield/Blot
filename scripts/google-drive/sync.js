const sync = require("clients/google-drive/sync");
const get = require("./get-blog");

const args = Array.from(process.argv);

get(function (err, user, blog) {
  if (err) throw err;

  const options = { fromScratch: args.indexOf("-s") > -1 };

  sync(blog.id, options, function then(err) {
    if (err) throw err;

    console.log("Synced!");

    if (args.indexOf("-c") > -1) {
      console.log("Syncing again in 1s.");
      return setTimeout(() => sync(blog.id, options, then), 1000);
    }

    process.exit();
  });
});
