const createDriveClient = require("./serviceAccount/createDriveClient");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const fs = require("fs-extra");
const database = require("./database");

module.exports = async function remove(blogID, path, callback) {
  const prefix = () => clfdate() + " Google Drive:";
  try {
    const account = await database.blog.get(blogID);
    const drive = await createDriveClient(account.serviceAccountId);
    const { getByPath } = database.folder(account.folderId);

    console.log(prefix(), "Looking up fileId for", path);

    const fileId = await getByPath(path);

    if (fileId) {
      console.log(prefix(), "Removing", fileId, "from API");
      await drive.files.delete({ fileId });
      console.log(prefix(), "Removed", fileId, "from API");
    } else {
      console.log(prefix(), "No fileId found in db for", path);
    }

    // We don't need to update the client database
    // database.folder.remove(...)
    // of file IDs because once removed, we'll sync
    // with google drive after receiving a webhook
    console.log(prefix(), "Removing", path, "from local folder");
    const pathOnBlot = localPath(blogID, path);
    await fs.remove(pathOnBlot);
    console.log(prefix(), "Removed", path, "from local folder");
  } catch (e) {
    console.log(prefix(), "Error removing", path, e);
    return callback(e);
  }
  callback(null);
};
