const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const database = require("./database");

const verify = require("./util/verify");
const download = require("./util/download");
const createDriveClient = require("./util/createDriveClient");
const determinePathToFolder = require("./util/determinePathToFolder");
const establishSyncLock = require("./util/establishSyncLock");

const RETRY_INTERVALS = [50, 500, 3000, 5000];

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
    const folderId = account.folderId;

    const db = database.folder(folderId);

    folder.log("folderId =", folderId);

    let retries = 0;
    let pageToken, newStartPageToken, nextPageToken;

    if (account.error)
      return done(new Error("Account has error: " + account.error), callback);

    pageToken = await db.getPageToken();

    if (!pageToken) {
      folder.log("Fetching new pageToken from API");
      const { data } = await drive.changes.getStartPageToken({
        supportsAllDrives: true,
        includeDeleted: true,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
      });
      pageToken = data.startPageToken;
    }

    do {
      folder.log("Retrieving changes since", pageToken);
      const response = await drive.changes.list({
        supportsAllDrives: true,
        includeDeleted: true,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
        fields: [
          "nextPageToken",
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
      let pathsToUpdate = [];

      for (const { file } of changes) {
        const { id, parents, name, trashed } = file;
        const storedPathForId = await db.get(id);
        const storedPathForParentId = await db.get(parents && parents[0]);
        const path = storedPathForParentId
          ? join(storedPathForParentId, name)
          : null;
        const movedOutsideFolder = storedPathForId && !storedPathForParentId;

        if (trashed && id === folderId) {
          await db.remove(id);
          await database.setAccount(blogID, {
            folderId: "",
            folderPath: "",
            latestActivity: "",
          });
          return done(null, callback);
        } else if (id === folderId) {
          const folderPath = await determinePathToFolder(drive, id);
          await database.setAccount(blogID, { folderPath });
        } else if ((trashed || movedOutsideFolder) && storedPathForId) {
          folder.log("DELETE", storedPathForId);
          const removedPaths = await db.remove(id);
          removedPaths.forEach((removedPath) =>
            pathsToUpdate.push(removedPath)
          );
          await fs.remove(localPath(blogID, storedPathForId));
        } else if (path && storedPathForId && path !== storedPathForId) {
          folder.log("  MOVE", storedPathForId, "to", path);
          const movedPaths = await db.move(id, path);
          movedPaths.forEach((movedPath) => pathsToUpdate.push(movedPath));
          await fs.move(
            localPath(blogID, storedPathForId),
            localPath(blogID, path)
          );
        } else if (path && !storedPathForId && !trashed) {
          folder.log("CREATE", path);
          await db.set(id, path);
          await download(blogID, drive, path, file);
          pathsToUpdate.push(path);
        } else if (path && storedPathForId) {
          folder.log("UPDATE", storedPathForId);
          await download(blogID, drive, path, file);
          pathsToUpdate.push(path);
        } else {
          folder.log("IGNORE", id, "outside folder");
        }
      }

      for (const path of pathsToUpdate) {
        try {
          await folder.update(path);
        } catch (e) {
          folder.log("ERROR updating", path, e);
        }
      }

      newStartPageToken = response.data.newStartPageToken;
      nextPageToken = response.data.nextPageToken;

      if (newStartPageToken && newStartPageToken !== pageToken) {
        retries = 0;
        pageToken = newStartPageToken;
        await db.setPageToken(pageToken);
        folder.log("There is new page token");
      } else if (nextPageToken) {
        retries = 0;
        pageToken = nextPageToken;
        await db.setPageToken(pageToken);
        folder.log("There is a NEXT page of changes to fetch");
      } else {
        folder.log("Waiting to retry check for changes");
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_INTERVALS[retries])
        );
        folder.log("Wait complete");
        retries++;
      }
    } while (
      nextPageToken ||
      (newStartPageToken && pageToken !== newStartPageToken) ||
      retries < RETRY_INTERVALS.length
    );

    folder.log("All checks complete");
    done(null, callback);
  } catch (err) {
    folder.log("Error:", err.message);
    try {
      verify(blogID);
    } catch (e) {
      folder.log("Error verifying folder:", e.message);
      return done(e, callback);
    }

    done(null, callback);
  }
};
