const createDriveClient = require("./util/createDriveClient");
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = async function remove(blogID, path, callback) {
  try {
    const { drive, account } = await createDriveClient(blogID);
    const fileId = await establishFileId(drive, path, account.folderID);

    console.log("fileId is", fileId);

    // todo determine if file already exists
    // then do update instead to avoid duping it.
    if (fileId) await drive.files.delete({ fileId });

    const pathOnBlot = localPath(blogID, path);
    await fs.remove(pathOnBlot);
  } catch (e) {
    console.log(e);
    return callback(e);
  }

  callback(null);
};

const establishFileId = async (drive, path, blogFolderID) => {
  if (path[0] !== "/") path = "/" + path;

  console.log(path, "is path");

  const parentDirs = path.split("/").slice(1);
  console.log(parentDirs, "is parentDirs");

  const walk = async (folderID, parentDirs) => {
    const dirToCheck = parentDirs.shift();

    const { data } = await drive.files.list({
      q: `'${folderID}' in parents and trashed = false`,
    });

    console.log("looking for", dirToCheck, "in", folderID);

    let dirID =
      data.files.filter((i) => i.name === dirToCheck).length &&
      data.files.filter((i) => i.name === dirToCheck)[0].id;

    // One of the parent directories of the path does not exist
    // therefore the file does not exist
    if (!dirID) {
      return null;
    }

    return parentDirs.length ? walk(dirID, parentDirs) : dirID;
  };

  return await walk(blogFolderID, parentDirs);
};
