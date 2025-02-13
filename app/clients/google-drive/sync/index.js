const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const database = require("../database");
const download = require("../util/download");
const { promisify } = require("util");
const createDriveClient = require("../util/createDriveClient");
const establishSyncLock = require("../util/establishSyncLock");
const getBlog = promisify(require("models/blog").get);
const fix = promisify(require("sync/fix"));

const reset = require("./reset-to-blot");

// const determinePathToFolder = require("../util/determinePathToFolder");

async function sync(blogID) {

  console.log('SYNCING', blogID);

  const blog = await getBlog({ id: blogID });

  console.log('Got blog', blog);

  console.log("waiting for lock");
  const { done, folder } = await establishSyncLock(blogID);
  console.log("got lock");

  
  const drive = await createDriveClient(blogID);
  const account = await database.getAccount(blogID);
  const { folderId, error } = account;

  if (error) {
    await done(new Error("Account has error: " + account.error));
    return;
  }

  const db = database.folder(folderId);

  folder.status("Checking for changes");
  const pageToken = await getStartPageToken(db, drive);

  const { changes, newStartPageToken, nextPageToken } = await getChanges(
    drive,
    pageToken
  );

  let pathsToUpdate = [];

  for (const { file } of changes) {
    const { id, parents, trashed } = file;

    // we append '.gdoc' to the name of the file
    // if it is a google doc 
    const name = file.mimeType === "application/vnd.google-apps.document"
      ? file.name + '.gdoc'
      : file.name;

    const storedPathForId = await db.get(id);
    const storedPathForParentId = await db.get(parents && parents[0]);

    const path = storedPathForParentId
      ? join(storedPathForParentId, name)
      : null;

    const movedOutsideFolder = storedPathForId && !storedPathForParentId;

    if (trashed && id === folderId) {
      folder.status("You removed your folder on Google Drive");
      await db.remove(id);
      await database.setAccount(blogID, {
        folderId: "",
        folderPath: "",
        latestActivity: "",
      });
      return done();
    } else if (id === folderId) {
      folder.status("You moved your folder on Google Drive");
      // const folderPath = await determinePathToFolder(drive, id);
      // await database.setAccount(blogID, { folderPath });
    } else if ((trashed || movedOutsideFolder) && storedPathForId) {
      folder.status("Removing", storedPathForId);
      const removedPaths = await db.remove(id);
      removedPaths.forEach((removedPath) => pathsToUpdate.push(removedPath));
      await fs.remove(localPath(blogID, storedPathForId));
    } else if (path && storedPathForId && path !== storedPathForId) {
      folder.status("Moving", storedPathForId);
      const movedPaths = await db.move(id, path);
      movedPaths.forEach((movedPath) => pathsToUpdate.push(movedPath));
      await fs.move(
        localPath(blogID, storedPathForId),
        localPath(blogID, path)
      );
    } else if (path && !storedPathForId && !trashed) {
      folder.log("Downloading", path);
      await db.set(id, path);
      await download(blogID, drive, path, file);
      pathsToUpdate.push(path);
    } else if (path && storedPathForId) {
      folder.log("Updating", storedPathForId);
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

  // Store the latest page token
  await db.setPageToken(nextPageToken || newStartPageToken);

  folder.log("All checks complete");

  await reset(blogID, folder.status, folder.update);
  await fix(blog);
  await done();
}

const getStartPageToken = async (db, drive) => {
  const tokenInDB = await db.getPageToken();

  if (tokenInDB) return tokenInDB;

  const { data } = await drive.changes.getStartPageToken({
    supportsAllDrives: true,
    includeDeleted: true,
    includeCorpusRemovals: true,
    includeItemsFromAllDrives: true,
  });
  return data.startPageToken;
};

const getChanges = async (drive, pageToken) => {
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
  return response.data;
};
module.exports = sync;
