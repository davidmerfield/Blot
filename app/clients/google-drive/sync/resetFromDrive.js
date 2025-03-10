const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../serviceAccount/createDriveClient");
const CheckWeCanContinue = require("../util/checkWeCanContinue");

const localReaddir = require('./util/localReaddir');
const driveReaddir = require('./util/driveReaddir');

const truncateToSecond = require("./util/truncateToSecond");

module.exports = async (blogID, publish, update) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  const account = await database.blog.get(blogID);
  const drive = await createDriveClient(account.serviceAccountId);
  const { reset, get, set, remove } = database.folder(account.folderId);
  const checkWeCanContinue = CheckWeCanContinue(blogID, account);

  // resets pageToken and folderState
  await reset();

  const walk = async (dir, dirId) => {
    publish("Checking", dir);

    const [remoteContents, localContents] = await Promise.all([
      driveReaddir(drive, dirId),
      localReaddir(localPath(blogID, dir)),
    ]);

    // Since we reset the database of file ids
    // we need to restore this now
    set(dirId, dir, {isDirectory: true});

    for (const { name } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing local item", join(dir, name));
        const id = await get(path);
        await remove(id);
        await fs.remove(localPath(blogID, path));
        if (update) await update(path);
      }
    }

    for (const file of remoteContents) {
      const { id, name, mimeType, md5Checksum, modifiedTime } = file;
      const path = join(dir, name);
      const existsLocally = localContents.find((item) => item.name === name);
      const isDirectory = mimeType === "application/vnd.google-apps.folder";

      // Store the Drive ID against the path of this item, along with metadata
      await set(id, path, { mimeType, md5Checksum, modifiedTime, isDirectory });

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          await checkWeCanContinue();
          publish("Removing", path);
          const idToRemove = await get(path);
          await remove(idToRemove);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        } else if (!existsLocally) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        }

        await walk(path, id);
      } else {
        // These do not have a md5Checksum so we fall
        // back to using the modifiedTime
        const isGoogleAppFile = mimeType.startsWith(
          "application/vnd.google-apps."
        );

        // We truncate to the second because the Google Drive API returns
        // precise mtimes but the local file system only has second precision
        const identicalOnRemote =
          existsLocally &&
          (isGoogleAppFile
            ? truncateToSecond(existsLocally.modifiedTime) === truncateToSecond(modifiedTime)
            : existsLocally.md5Checksum === md5Checksum);

        if (existsLocally && !identicalOnRemote) {
          try {
            await checkWeCanContinue();
            publish("Updating", path);
            await download(blogID, drive, path, file);
            if (update) await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        } else if (!existsLocally) {
          try {
            await checkWeCanContinue();
            publish("Downloading", path);
            await download(blogID, drive, path, file);
            if (update) await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        }
      }
    }
  };

  try {
    await walk("/", account.folderId);
  } catch (err) {
    publish("Sync failed", err.message);
    // Possibly rethrow or handle
  }
};




