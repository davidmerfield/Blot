const createDriveClient = require("./util/createDriveClient");
const dirname = require("path").dirname;
const basename = require("path").basename;
const localPath = require("helper/localPath");
const fs = require("fs-extra");

const { Readable } = require("stream");

function bufferToStream(binary) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

  return readableInstanceStream;
}

module.exports = async function write(blogID, path, contents, callback) {
  if (Buffer.isBuffer(contents)) contents = bufferToStream(contents);

  const { drive, account } = await createDriveClient(blogID);

  if (!account.folderID)
    return callback(
      new Error(
        "Cannot write with the Google Drive client without setting a folderID"
      )
    );

  try {
    const parentID = await establishParentDirectories(
      drive,
      path,
      account.folderID
    );

    console.log("parentID is", parentID);

    if (!parentID) throw new Error("No parent ID");

    // todo determine if file already exists
    // then do update instead to avoid duping it.
    await drive.files.create({
      resource: {
        name: basename(path),
        parents: [parentID],
      },
      media: {
        body: contents,
      },
      fields: "id",
    });

    const pathOnBlot = localPath(blogID, path);
    await fs.outputFile(pathOnBlot, contents);
  } catch (e) {
    console.log(e);
    return callback(e);
  }

  callback(null);
};

const establishParentDirectories = async (drive, path, blogFolderID) => {
  if (path[0] !== "/") path = "/" + path;

  const pathParent = dirname(path);

  console.log(path, "is path");
  console.log(pathParent, "is pathParent");

  if (pathParent === "/") return blogFolderID;

  const parentDirs = pathParent.split("/").slice(1);
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

    if (!dirID) {
      console.log("creating", dirToCheck);
      const res = await drive.files.create({
        resource: {
          name: dirToCheck,
          parents: [folderID],
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id",
      });

      dirID = res.data.id;
    }

    return parentDirs.length ? walk(dirID, parentDirs) : dirID;
  };

  return await walk(blogFolderID, parentDirs);
};
