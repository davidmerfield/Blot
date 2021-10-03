const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const database = require("./database");

const download = require("./util/download");
const createDriveClient = require("./util/createDriveClient");
const determinePathToFolder = require("./util/determinePathToFolder");
const establishSyncLock = require("./util/establishSyncLock");

const RETRY_INTERVALS = [100, 1000, 4000];

module.exports = async function (blogID, options, callback) {
  let done, folder;

  try {
    let lock = await establishSyncLock(blogID);
    done = lock.done;
    folder = lock.folder;
  } catch (err) {
    return callback(err);
  }

  try {
    const { drive, account } = await createDriveClient(blogID);
    const folderId = account.folderID;
    const db = database.folder(folderId);
    let retries = 0;
    let pageToken, newStartPageToken;

    if (account.error)
      return done(new Error("Account has error: " + account.error), callback);

    do {
      pageToken = await db.getPageToken(drive);
      console.log("Retrieving changes since", pageToken);

      const response = await drive.changes.list({
        supportsAllDrives: true,
        includeDeleted: true,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
        fields: [
          "newStartPageToken",
          "changes/file/id",
          "changes/file/name",
          "changes/file/mimeType",
          "changes/file/trashed",
          "changes/file/parents",
          "changes/file/modifiedTime",
          "changes/file/md5Checksum",
        ].join(","),
        pageToken,
      });

      const changes = response.data.changes;

      for (const { file } of changes) {
        const { id, parents, name, trashed } = file;
        const storedPathForId = await db.get(id);
        const storedPathForParentId = await db.get(parents && parents[0]);
        const path = storedPathForParentId
          ? join(storedPathForParentId, name)
          : null;

        if (trashed && id === folderId) {
          await db.remove(id);
          await database.setAccount(blogID, {
            folderID: "",
            folderPath: "",
            folderName: "",
            latestActivity: "",
          });
          return done(null, callback);
        } else if (id === folderId) {
          const folderPath = await determinePathToFolder(drive, id);
          await database.setAccount(blogID, { folderPath });
        } else if (trashed && storedPathForId) {
          console.log("DELETE", storedPathForId);
          await db.remove(id);
          await fs.remove(localPath(blogID, storedPathForId));
          await folder.update(storedPathForId);
        } else if (path && storedPathForId && path !== storedPathForId) {
          console.log("  MOVE", storedPathForId, "to", path);
          await db.move(id, path);
          await fs.move(
            localPath(blogID, storedPathForId),
            localPath(blogID, path)
          );
          await folder.update(storedPathForId);
          await folder.update(path);
        } else if (path && !storedPathForId && !trashed) {
          console.log("CREATE", path);
          await db.set(id, path);
          await download(blogID, drive, path, file);
          await folder.update(path);
        } else if (storedPathForId) {
          console.log("UPDATE", storedPathForId);
          await download(blogID, drive, path, file);
          await folder.update(path);
        } else {
          console.log("IGNORE", id, "outside folder");
        }
      }

      newStartPageToken = response.data.newStartPageToken;

      if (newStartPageToken !== pageToken) {
        retries = 0;
        await db.setPageToken(newStartPageToken);
      } else {
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_INTERVALS[retries])
        );
        retries++;
      }
    } while (
      pageToken !== newStartPageToken ||
      retries < RETRY_INTERVALS.length
    );

    done(null, callback);
  } catch (err) {
    return done(err, callback);
  }
};
