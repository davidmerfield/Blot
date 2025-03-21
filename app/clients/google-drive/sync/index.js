const { promisify } = require("util");
const establishSyncLock = require("../util/establishSyncLock");
const getBlog = promisify(require("models/blog").get);
const fix = promisify(require("sync/fix"));

const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../serviceAccount/createDriveClient");
const CheckWeCanContinue = require("../util/checkWeCanContinue");

const driveReaddir = require("./util/driveReaddir");
const localReaddir = require("./util/localReaddir");

const truncateToSecond = require("./util/truncateToSecond");

module.exports = async function (blogID) {
  const blog = await getBlog({ id: blogID });

  const { done, folder } = await establishSyncLock(blogID);

  try {
    await sync(blogID, folder.status, folder.update);
  } catch (err) {
    console.log(clfdate(), "Google Drive Sync:", "Sync failed", err);
  }

  await fix(blog);
  await done();
};

const sync = async (blogID, publish, update) => {
  const account = await database.blog.get(blogID);

  const { serviceAccountId, folderId } = account;

  if (!serviceAccountId || !folderId) {
    throw new Error("Missing required arguments for sync");
  }

  const prefix = () =>
    `${clfdate()} Google Drive Sync: ${blogID} serviceAccountId=${serviceAccountId} folderId=${folderId}`;

  if (!publish)
    publish = (...args) => {
      console.log(prefix(), args.join(" "));
    };

  if (!update) {
    update = async () => {};
  }

  const drive = await createDriveClient(serviceAccountId);
  const { getByPath, set, remove } = database.folder(account.folderId);
  const checkWeCanContinue = CheckWeCanContinue(blogID, account);

  const walk = async (dir, dirId) => {
    if (!dir || !dirId) {
      throw new Error("Missing required arguments for walk");
    }

    // Ensure the dir is stored against the dirId
    await set(dirId, dir, { isDirectory: true });

    const [remoteContents, localContents] = await Promise.all([
      driveReaddir(drive, dirId),
      localReaddir(localPath(blogID, dir)),
    ]);

    for (const { name } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing", join(dir, name));
        await fs.remove(localPath(blogID, path));
        await update(path);
        await remove(await getByPath(path));
      }
    }

    for (const {
      id,
      name,
      isDirectory,
      size,
      modifiedTime,
      mimeType,
      md5Checksum,
    } of remoteContents) {
      const path = join(dir, name);
      const existsLocally = localContents.find((item) => item.name === name);

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          await checkWeCanContinue();
          publish("Removing file", path);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        } else if (!existsLocally) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        }

        await walk(path, id);
      } else {
        // Ensure the file is stored in the database
        // any folders will be stored as they are walked
        await set(id, path, { isDirectory, modifiedTime });

        const identical = existsLocally?.size === size;
        
        if (!existsLocally || !identical) {
          await checkWeCanContinue();
          publish(
            "Downloading",
            path,
            "local=" + !!existsLocally,
            "localSize=" + (existsLocally?.size || "N/A"),
            "size=" + size,
            "identical=" + identical
          );
          const updated = await download(blogID, drive, path, {
            id,
            md5Checksum,
            mimeType,
            modifiedTime,
          });
          if (updated) await update(path);
        }
      }
    }
  };

  try {
    await walk("/", folderId);
  } catch (err) {
    publish("Sync failed", err.message);
  }
};
