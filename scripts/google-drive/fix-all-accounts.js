const redisKeys = require("helper/redisKeys");
const client = require("client");
const allAccountsKey = "clients:google-drive:all-accounts";

client.smembers(allAccountsKey, function (err, existingBlogIDs) {
  if (err) throw err;
  console.log("Before", existingBlogIDs);

  redisKeys("blog:*:google-drive:account", function (err, keys) {
    if (err) throw err;
    const blogIDs = keys.map((key) =>
      key.slice("blog:".length, key.indexOf(":google-drive:account"))
    );

    console.log("Keys", keys);
    console.log("blogIDs", blogIDs);

    const multi = client.multi();

    blogIDs.forEach((blogID) => multi.sadd(allAccountsKey, blogID));

    multi.exec(function (err) {
      if (err) throw err;
      client.smembers(allAccountsKey, function (err, nowBlogIDs) {
        console.log("After", nowBlogIDs);
        process.exit();
      });
    });
  });
});
