const sync = require("clients/google-drive/sync");
const get = require("./get-blog");

const args = Array.from(process.argv);

if (!args.length) {
  console.log("Sync every second (continuously):");
  console.log("node scripts/google-drive/sync -c");
  console.log();
  console.log("Sync without making changes (dry run):");
  console.log("node scripts/google-drive/sync -d");
  console.log();
  console.log("Sync changes after date (latestActivity) with dry-run:");
  console.log("node scripts/google-drive/sync -d -l 2021-09-30T18:00:00.978Z");
}

get(function (err, user, blog) {
  if (err) throw err;

  const options = {
    dryRun: args.indexOf("-d") > -1,
    fromScratch: args.indexOf("-s") > -1,
    latestActivity: args.indexOf("-l") > -1 && args[args.indexOf("-l") + 1],
  };

  console.log("Syncing with options", options);

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
