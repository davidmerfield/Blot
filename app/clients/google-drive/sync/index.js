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

const truncateToSecond = require("./util/truncateToSecond");

module.exports = async function (blogID) {
  const blog = await getBlog({ id: blogID });

  const { done, folder } = await establishSyncLock(blogID);

  try {
    await sync(blogID, folder.status, folder.update);
  } catch (err) {
    console.log(clfdate(), "Google Drive:", "Sync failed", err);
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
    `${clfdate()} Google Drive: ${blogID} serviceAccountId=${serviceAccountId} folderId=${folderId}`;

  if (!publish)
    publish = (...args) => {
      console.log(prefix(), args.join(" "));
    };

  const drive = await createDriveClient(serviceAccountId);
  const { get, set, remove, readdir } = database.folder(folderId);
  const checkWeCanContinue = CheckWeCanContinue(blogID, account);

  const databaseReaddir = async (readdir, dir) => {
    const contents = await readdir(dir);
    return contents.map(({ path, metadata, id }) => ({
      name: path.split("/").pop(),
      id,
      ...metadata,
    }));
  };

  const walk = async (dir, dirId) => {
    // publish("Checking", dir);
    console.log(prefix(), "readdir", dir);

    const [remoteContents, localContents] = await Promise.all([
      driveReaddir(drive, dirId),
      databaseReaddir(readdir, dir),
    ]);

    // Since we reset the database of file ids
    // we need to restore this now
    console.log(
      prefix(),
      "set dir=" + dir,
      "dirId=" + dirId,
      "isDirectory=true"
    );
    set(dirId, dir, { isDirectory: true });

    for (const { name, id } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing", join(dir, name));
        console.log(prefix(), "remove database/local path=" + path, "id=" + id);
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
      console.log(
        prefix(),
        "set path=" + path,
        "id=" + id,
        "mimeType=" + mimeType,
        "md5Checksum=" + md5Checksum,
        "modifiedTime=" + modifiedTime,
        "isDirectory=" + isDirectory
      );
      await set(id, path, { mimeType, md5Checksum, modifiedTime, isDirectory });

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          await checkWeCanContinue();
          publish("Removing", path);
          console.log(prefix(), "remove file path=" + path, "id=" + id);
          await remove(existsLocally.id);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          console.log(prefix(), "create dir path=" + path, "id=" + id);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        } else if (!existsLocally) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          console.log(prefix(), "ensure dir path=" + path, "id=" + id);
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
            ? truncateToSecond(existsLocally.modifiedTime) ===
              truncateToSecond(modifiedTime)
            : existsLocally.md5Checksum === md5Checksum);

        if (!existsLocally || !identicalOnRemote) {
          try {
            await checkWeCanContinue();
            publish("Downloading", path);
            await download(blogID, drive, path, file);
            if (update) {
              publish("Saving", path);
              await update(path);
            }

            if (!existsLocally) {
              console.log(prefix(), path, "was not found in database");
            } else {
              if (existsLocally.md5Checksum !== md5Checksum) {
                console.log(
                  prefix(),
                  path,
                  "md5Checksum in database does not match local=",
                  existsLocally.md5Checksum,
                  "remote=",
                  md5Checksum
                );
              }
              if (
                truncateToSecond(existsLocally.modifiedTime) !==
                truncateToSecond(modifiedTime)
              ) {
                console.log(
                  prefix(),
                  path,
                  "isGoogleAppFile=",
                  isGoogleAppFile,
                  "mime=",
                  mimeType,
                  "modifiedTime in database local=",
                  existsLocally.modifiedTime,
                  "remote=",
                  modifiedTime,
                  "localTruncated=",
                  truncateToSecond(existsLocally.modifiedTime),
                  "remoteTruncated=",
                  truncateToSecond(modifiedTime)
                );
              }
            }
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
