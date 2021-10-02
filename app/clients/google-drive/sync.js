const Sync = require("sync");
const { promisify } = require("util");
const createDriveClient = require("../util/createDriveClient");
const determinePathToFolder = require("./determinePathToFolder");
const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const database = require("../database");
const download = require("./download");
const opts = {
  retryCount: 1,
  retryDelay: 10,
  retryJitter: 10,
  ttl: 30 * 60 * 1000, // 30 minutes
};

module.exports = function (blogID, options, callback) {
  Sync(blogID, opts, async function check(err, folder, done) {
    if (err) return callback(err);
    folder.update = promisify(folder.update);

    const { drive, account } = await createDriveClient(blogID);

    if (account.error)
      return done(new Error("Account has error: " + account.error), callback);

    const folderId = account.folderID;
    const db = database.folder(folderId);
    const pageToken = await db.getPageToken(folderId, drive);
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

    await fs.outputJSON(
      __dirname + "/changes/data/" + new Date() + ".json",
      response,
      {
        spaces: 2,
      }
    );

    // Store blog folder
    await db.set(folderId, folderId, "/");

    const changes = response.data.changes;

    for (const { file } of changes) {
      // console.log(colors.green(JSON.stringify(file, null, 2)));

      const {
        id,
        parents,
        name,
        trashed,
        md5Checksum,
        modifiedTime,
        mimeType,
      } = file;
      const storedPathForId = await db.get(folderId, id);
      const storedPathForParentId = await db.get(
        folderId,
        parents && parents[0]
      );
      const path = storedPathForParentId
        ? join(storedPathForParentId, name)
        : null;

      if (trashed && id === folderId) {
        await db.del(folderId, id);
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
        await db.del(folderId, id);
        await fs.remove(localPath(blogID, storedPathForId));
        await folder.update(storedPathForId);
      } else if (path && storedPathForId && path !== storedPathForId) {
        console.log("  MOVE", storedPathForId, "to", path);
        await db.move(folderId, id, path);
        await fs.move(
          localPath(blogID, storedPathForId),
          localPath(blogID, path)
        );
        await folder.update(storedPathForId);
        await folder.update(path);
      } else if (path && !storedPathForId && !trashed) {
        console.log("CREATE", path);
        await db.set(folderId, id, path);
        await download(
          blogID,
          drive,
          id,
          path,
          md5Checksum,
          mimeType,
          modifiedTime
        );
        await folder.update(path);
      } else if (storedPathForId) {
        console.log("UPDATE", storedPathForId);
        await download(
          blogID,
          drive,
          id,
          path,
          md5Checksum,
          mimeType,
          modifiedTime
        );
        await folder.update(path);
      } else {
        console.log("IGNORE", id, "outside folder");
      }
    }

    if (response.data.newStartPageToken)
      await db.setPageToken(folderId, response.data.newStartPageToken);

    await db.print(folderId);

    if (pageToken !== response.data.newStartPageToken) {
      setTimeout(() => check(null, folder, done), 500);
    } else {
      done(null, callback);
    }
  });
};
