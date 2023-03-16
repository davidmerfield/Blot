const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../util/createDriveClient");
const getmd5Checksum = require("../util/md5Checksum");

module.exports = async (blogID, publish) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  const { drive, account } = await createDriveClient(blogID);
  const { folderId } = account;

  const { reset, get, set, remove } = database.folder(folderId);

  // reset pageToken
  // reset db.folder state
  await reset();

  const walk = async (dir, dirId) => {
    publish("Checking", dir);

    const [remoteContents, localContents] = await Promise.all([
      readdir(drive, dirId),
      localreaddir(localPath(blogID, dir)),
    ]);

    // Since we reset the database of file ids
    // we need to restore this now
    set(dirId, dir);

    for (const { name } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        publish("Removing local item", join(dir, name));
        const id = await get(path);
        await remove(id);
        await fs.remove(localPath(blogID, path));
      }
    }

    for (const file of remoteContents) {
      const { id, name, mimeType, md5Checksum } = file;
      const path = join(dir, name);
      const existsLocally = localContents.find((item) => item.name === name);
      const isDirectory = mimeType === "application/vnd.google-apps.folder";

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          publish("Removing local file", path);
          const idToRemove = await get(path);
          await remove(idToRemove);
          await fs.remove(localPath(blogID, path));
          publish("Creating local directory", path);
          await fs.mkdir(localPath(blogID, path));
          await set(id, path);
        } else if (!existsLocally) {
          publish("Creating local directory", path);
          await fs.mkdir(localPath(blogID, path));
          await set(id, path);
        }

        await walk(path, id);
      } else {
        const identicalOnRemote =
          existsLocally && existsLocally.md5Checksum === md5Checksum;

        if (existsLocally && !identicalOnRemote) {
          publish("Updating local version of", path);
          set(id, path);
          await download(blogID, drive, path, file);
        } else if (!existsLocally) {
          publish("Downloading", path);
          await download(blogID, drive, path, file);
          set(id, path);
        }
      }
    }
  };

  await walk("/", folderId);

  // sync will acquire a startPageToken
  // when it next runs
};

const localreaddir = async (dir) => {
  const contents = await fs.readdir(dir);

  return Promise.all(
    contents.map(async (name) => {
      const path = join(dir, name);
      const [md5Checksum, stat] = await Promise.all([
        getmd5Checksum(path),
        fs.stat(path),
      ]);

      return {
        name,
        md5Checksum,
        isDirectory: stat.isDirectory(),
      };
    })
  );
};

const readdir = async (drive, dirId) => {
  let res;
  let items = [];
  let nextPageToken;

  do {
    const params = {
      q: `'${dirId}' in parents and trashed = false`,
      pageToken: nextPageToken,
      fields:
        "nextPageToken, files/id, files/name, files/md5Checksum, files/mimeType",
    };
    res = await drive.files.list(params);
    items = items.concat(res.data.files);
    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return items;
};
