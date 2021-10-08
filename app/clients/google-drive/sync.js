const fs = require("fs-extra");
const { join } = require("path");
const clfdate = require("helper/clfdate");
const localPath = require("helper/localPath");
const database = require("./database");

const download = require("./util/download");
const createDriveClient = require("./util/createDriveClient");
const determinePathToFolder = require("./util/determinePathToFolder");
const establishSyncLock = require("./util/establishSyncLock");

const RETRY_INTERVALS = [100, 1000, 4000];

module.exports = async function (blogID, options, callback) {
  let done, folder;
  const prefix = () => clfdate() + " Google Drive:";

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
    let retries = 0;
    let pageToken, newStartPageToken, nextPageToken;

    if (account.error)
      return done(new Error("Account has error: " + account.error), callback);

    if (options.fromScratch) {
      pageToken = account.startPageToken;
      console.log(
        prefix(),
        "Using original startPageToken from setup:",
        pageToken
      );
    } else {
      pageToken = await db.getPageToken();
      console.log(prefix(), "Using pageToken from db:", pageToken);
    }

    if (!pageToken) {
      console.log(prefix(), "Fetching new pageToken from API");
      const { data } = await drive.changes.getStartPageToken({
        supportsAllDrives: true,
        includeDeleted: true,
        includeCorpusRemovals: true,
        includeItemsFromAllDrives: true,
      });
      pageToken = data.startPageToken;
    }

    do {
      console.log(prefix(), "Retrieving changes since", pageToken);
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

        if (trashed && id === folderId) {
          await db.remove(id);
          await database.setAccount(blogID, {
            folderId: "",
            folderPath: "",
            folderName: "",
            latestActivity: "",
          });
          return done(null, callback);
        } else if (id === folderId) {
          const folderPath = await determinePathToFolder(drive, id);
          await database.setAccount(blogID, { folderPath });
        } else if (trashed && storedPathForId) {
          console.log(prefix(), "DELETE", storedPathForId);
          await db.remove(id);
          await fs.remove(localPath(blogID, storedPathForId));
          pathsToUpdate.push(storedPathForId);
        } else if (path && storedPathForId && path !== storedPathForId) {
          console.log(prefix(), "  MOVE", storedPathForId, "to", path);
          await db.move(id, path);
          await fs.move(
            localPath(blogID, storedPathForId),
            localPath(blogID, path)
          );
          pathsToUpdate.push(storedPathForId);
          pathsToUpdate.push(path);
        } else if (path && !storedPathForId && !trashed) {
          console.log(prefix(), "CREATE", path);
          await db.set(id, path);
          await download(blogID, drive, path, file);
          pathsToUpdate.push(path);
        } else if (storedPathForId) {
          console.log(prefix(), "UPDATE", storedPathForId);
          await download(blogID, drive, path, file);
          pathsToUpdate.push(path);
        } else {
          console.log(prefix(), "IGNORE", id, "outside folder");
        }
      }

      for (const path of pathsToUpdate) {
        try {
          await folder.update(path);
        } catch (e) {
          console.log(prefix(), "ERROR updating", path, e);
        }
      }

      newStartPageToken = response.data.newStartPageToken;
      nextPageToken = response.data.nextPageToken;

      if (newStartPageToken && newStartPageToken !== pageToken) {
        retries = 0;
        pageToken = newStartPageToken;
        await db.setPageToken(pageToken);
        console.log(prefix(), "There is new page token");
      } else if (nextPageToken) {
        retries = 0;
        pageToken = nextPageToken;
        await db.setPageToken(pageToken);
        console.log(prefix(), "There is a NEXT page of changes to fetch");
      } else {
        console.log(prefix(), "Waiting to retry check for changes");
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_INTERVALS[retries])
        );
        console.log(prefix(), "Wait complete");
        retries++;
      }
    } while (
      nextPageToken ||
      (newStartPageToken && pageToken !== newStartPageToken) ||
      retries < RETRY_INTERVALS.length
    );

    console.log(prefix(), "All checks complete");
    done(null, callback);
  } catch (err) {
    return done(err, callback);
  }
};
