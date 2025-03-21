const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../serviceAccount/createDriveClient");
const CheckWeCanContinue = require("../util/checkWeCanContinue");

const truncateToSecond = require("./util/truncateToSecond");

const localReaddir = require("./util/localReaddir");
const driveReaddir = require("./util/driveReaddir");

module.exports = async (blogID, publish, update) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  if (!update) {
    update = async () => {};
  }

  const account = await database.blog.get(blogID);
  const drive = await createDriveClient(account.serviceAccountId);
  const { reset, getByPath, set, remove } = database.folder(account.folderId);
  const checkWeCanContinue = CheckWeCanContinue(blogID, account);

  // resets pageToken and folderState
  await reset();

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
    await walk("/", account.folderId);
  } catch (err) {
    publish("Sync failed", err.message);
    // Possibly rethrow or handle
  }
};
