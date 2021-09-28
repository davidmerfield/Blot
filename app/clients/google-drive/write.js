const createDriveClient = require("./util/createDriveClient");
const dirname = require("path").dirname;
const basename = require("path").basename;
const localPath = require("helper/localPath");
const debug = require("debug")("blot:clients:google-drive:write");
const fs = require("fs-extra");
const TMP = require("helper/tempDir")();
const guid = require("helper/guid");
const { Readable } = require("stream");
const database = require("./database");

// Turns a buffer or string into a readable stream
function makeStream(input) {
  const readableInstanceStream = new Readable({
    read() {
      this.push(input);
      this.push(null);
    },
  });

  return readableInstanceStream;
}

module.exports = async function write(blogID, path, input, callback) {
  try {
    let readStream;

    if (input instanceof Readable) {
      debug("input is readable stream...");
      readStream = input;
    } else if (Buffer.isBuffer(input) || typeof input === "string") {
      debug("input was converted to readable stream...");
      readStream = makeStream(input);
    }

    debug("writing stream to tmp");
    const tempPath = await writeToTmp(readStream);
    debug("ws close called");
    debug("wrote stream to tmp", tempPath);

    const { drive, account } = await createDriveClient(blogID);

    if (!account.folderID)
      return callback(
        new Error(
          "Cannot write with the Google Drive client without setting a folderID"
        )
      );

    const parentID = await establishParentDirectories(
      drive,
      path,
      account.folderID
    );

    debug("parentID is", parentID);

    if (!parentID) throw new Error("No parent ID");

    // todo determine if file already exists
    // then do update instead to avoid duping it.
    await drive.files.create({
      resource: {
        name: basename(path),
        parents: [parentID],
      },
      media: {
        body: fs.createReadStream(tempPath),
      },
      fields: "id",
    });

    const pathOnBlot = localPath(blogID, path);

    debug("moving", tempPath, "to", pathOnBlot);

    await fs.move(tempPath, pathOnBlot, { overwrite: true });

    // should we stream to tmp file then copy across?
    // can we do a write options:
  } catch (e) {
    return callback(e);
  }

  callback(null);
};

const writeToTmp = (readStream) => {
  return new Promise((resolve, reject) => {
    const tempPath = TMP + "/" + guid();
    const writeStream = fs.createWriteStream(tempPath);
    writeStream
      .on("error", reject)
      .on("finish", () => debug("ws finish called"))
      .on("close", () => resolve(tempPath));
    readStream
      .on("close", () => debug("rs close called"))
      .on("finish", () => debug("rs finish called"))
      .pipe(writeStream);
  });
};

const establishParentDirectories = async (drive, path, blogFolderID) => {
  if (path[0] !== "/") path = "/" + path;

  const pathParent = dirname(path);

  debug(path, "is path");
  debug(pathParent, "is pathParent");

  if (pathParent === "/") return blogFolderID;

  const parentDirs = pathParent.split("/").slice(1);
  debug(parentDirs, "is parentDirs");

  const walk = async (folderID, parentDirs) => {
    const dirToCheck = parentDirs.shift();

    const { data } = await drive.files.list({
      q: `'${folderID}' in parents and trashed = false`,
    });

    debug("looking for", dirToCheck, "in", folderID);

    let dirID =
      data.files.filter((i) => i.name === dirToCheck).length &&
      data.files.filter((i) => i.name === dirToCheck)[0].id;

    if (!dirID) {
      debug("creating", dirToCheck);
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
