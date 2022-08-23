const fs = require("fs-extra");
const { promisify } = require("util");
const upload = promisify(require("clients/dropbox/util/upload"));
const join = require("path").join;
const localPath = require("helper/localPath");

async function syncContents(account, lowerCaseContents) {
  // this could become verify.fromBlot
  await uploadAllFiles(account);

  // prepare folder for first sync, making all files lowercase
  await lowerCaseContents();

  return account;
}

async function uploadAllFiles(account, dir = "/") {
  const items = await fs.readdir(localPath(account.blog.id, dir));

  for (const item of items) {
    const stat = await fs.stat(localPath(account.blog.id, join(dir, item)));
    if (stat.isDirectory()) {
      await uploadAllFiles(account, join(dir, item));
    } else {
      const source = localPath(account.blog.id, join(dir, item));
      const destination = join(account.folder, dir, item);
      console.log("uploading from:", source);
      console.log("uploading to:", destination);

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
