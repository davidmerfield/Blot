const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../serviceAccount/createDriveClient");
const CheckWeCanContinue = require("../util/checkWeCanContinue");

const driveReaddir = require("./util/driveReaddir");
const localReaddir = require("./util/localReaddir");

const truncateToSecond = require("./util/truncateToSecond");
const { exists } = require("fs");

module.exports = async function sync(blogID, publish, update) {
  publish = publish || function () {};
  update = update || function () {};

  const account = await database.blog.get(blogID);
  const { folderId, serviceAccountId } = account;

  if (!blogID) {
    throw new Error("Missing blogID required arguments for sync");
  }

  if (!serviceAccountId) {
    throw new Error("Missing required serviceAccountId for sync");
  }

  if (!folderId) {
    throw new Error("Missing required folderId for sync");
  }

  const drive = await createDriveClient(serviceAccountId);
  const { getByPath, set, remove } = database.folder(folderId);
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
        console.log(
          "Removing",
          join(dir, name),
          "which does not exist remotely"
        );
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

      if (!isDirectory) {
        // Ensure the file is stored in the database
        // any folders will be stored as they are walked
        await set(id, path, { isDirectory, modifiedTime });

        // These do not have a md5Checksum so we fall
        // back to using the modifiedTime
        const isGoogleAppFile = mimeType.startsWith(
          "application/vnd.google-apps."
        );

        const identical = isGoogleAppFile
          ? truncateToSecond(existsLocally?.modifiedTime) ===
            truncateToSecond(modifiedTime)
          : existsLocally?.size === size;

        if (!existsLocally || !identical) {
          await checkWeCanContinue();
          publish("Downloading", path);

          if (existsLocally) {
            console.log("Updating out-of-sync:", path);
            console.log(
              "identical=false localSize=" + existsLocally.size,
              "remoteSize=" + size
            );
          } else {
            console.log("Downloading missing:", path);
          }

          const updated = await download(blogID, drive, path, {
            id,
            md5Checksum,
            mimeType,
            modifiedTime,
          });

          if (updated) await update(path);
        }
      } else {
        if (existsLocally && !existsLocally.isDirectory) {
          await checkWeCanContinue();
          publish("Removing file", path);
          console.log("Removing file", path, "which is a directory remotely");
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        } else if (!existsLocally) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          console.log("Creating directory locally", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        }

        await walk(path, id);
      }
    }
  };

  try {
    await walk("/", folderId);
  } catch (err) {
    publish("Sync failed", err.message);
  }
};
