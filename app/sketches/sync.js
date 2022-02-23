const bull = require("bull");
const syncQueue = new bull("sync");
const buildQueue = new bull("build");

console.log("Started sync process", process.pid);

buildQueue.process(__dirname + "/build.js");

syncQueue.process(async ({ data: { blogID } }) => {
  console.log("syncing", blogID);
  await buildQueue.add({ blogID, path: "/bat.txt" });
  await buildQueue.add({ blogID, path: "/foo.txt" });
  return;
});
