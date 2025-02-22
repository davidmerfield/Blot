const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../serviceAccount/createDriveClient");

const localReaddir = require('./util/localReaddir');
const driveReaddir = require('./util/driveReaddir');

// todo: add a checkWeCanContinue function
// which verifies the folder is still connected to google drive
// before applying any changes (e.g. if disconnect happened)
module.exports = async (blogID, publish, update) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  const account = await database.blog.get(blogID);
  const drive = await createDriveClient(account.serviceAccountId);
  const { reset, get, set, remove } = database.folder(account.folderId);

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
    set(dirId, dir);

    for (const { name } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
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
      await set(id, path, { mimeType, md5Checksum, modifiedTime });

      if (isDirectory) {
        publish("Is directory", path, JSON.stringify(existsLocally));
        if (existsLocally && !existsLocally.isDirectory) {
          publish("Removing", path);
          const idToRemove = await get(path);
          await remove(idToRemove);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        } else if (!existsLocally) {
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
            publish("Updating", path, "modifiedTime", modifiedTime, "local.modifiedTime", existsLocally.modifiedTime, "md5Checksum", md5Checksum, "local.md5Checksum", existsLocally.md5Checksum, "isGoogleAppFile", isGoogleAppFile);
            await download(blogID, drive, path, file);
            if (update) await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        } else if (!existsLocally) {
          try {
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




function truncateToSecond(isoString) {
  if (!isoString) return null; // Guard in case of null/undefined
  const date = new Date(isoString);
  date.setMilliseconds(0);
  return date.toISOString();
}