const fs = require("fs-extra");
const { promisify } = require("util");
const upload = promisify(require("clients/dropbox/util/upload"));
const join = require("path").join;
const localPath = require("helper/localPath");
const lowerCaseContents = require("sync/lowerCaseContents");

async function syncContents(account, folder, signal, blogID) {
  if (signal.aborted) return;
  // this could become verify.fromBlot
  await uploadAllFiles(account, folder, signal);

  if (signal.aborted) return;

  // prepare folder for first sync, making all files lowercase
  await lowerCaseContents(blogID);

  return account;
}

async function uploadAllFiles(account, folder, signal, dir = "/") {
  if (signal.aborted) return;

  const items = await fs.readdir(localPath(account.blog.id, dir));

  for (const item of items) {
    if (signal.aborted) return;
    const stat = await fs.stat(localPath(account.blog.id, join(dir, item)));
    if (stat.isDirectory()) {
      await uploadAllFiles(account, folder, signal, join(dir, item));
    } else {
      folder.status("Transferring " + join(dir, item));
      const source = localPath(account.blog.id, join(dir, item));
      const destination = join(account.folder, dir, item);

      try {
        await upload(account.client, source, destination);
      } catch (err) {
        const { status, error } = err;
        if (
          status === 409 &&
          error.error_summary.startsWith("path/disallowed_name")
        ) {
          continue;
        } else {
          console.log("here,", status, error);
          throw err;
        }
      }
    }
  }
}

module.exports = syncContents;
