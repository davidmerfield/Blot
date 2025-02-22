const { promisify } = require("util");
const establishSyncLock = require("../util/establishSyncLock");
const getBlog = promisify(require("models/blog").get);
const fix = promisify(require("sync/fix"));

const reset = require("./reset-from-google-drive");

async function sync(blogID) {

  const blog = await getBlog({ id: blogID });

  const { done, folder } = await establishSyncLock(blogID);

  await reset(blogID, folder.status, folder.update);
  await fix(blog);
  await done();
}

module.exports = sync;