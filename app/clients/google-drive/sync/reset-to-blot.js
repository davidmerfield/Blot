const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const download = require("../util/download");
const createDriveClient = require("../util/createDriveClient");
const getmd5Checksum = require("../util/md5Checksum");
const setupWebhook = require("../util/setupFilesWebhook");

module.exports = async (blogID, publish, update) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  const drive = await createDriveClient(blogID);
  const account = await database.getAccount(blogID);
  const { reset, get, set, remove } = database.folder(account.folderId);

  // resets pageToken and folderState
  await reset();

  const walk = async (dir, dirId) => {
    publish("Checking", dir);

    // Monitor this directory for changes if it's the root
    if (dir === "/") await setupWebhook(blogID, dirId);

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
        if (update) await update(path);
      }
    }

    for (const file of remoteContents) {
      const { id, name, mimeType, md5Checksum } = file;
      const path = join(dir, name);
      const existsLocally = localContents.find((item) => item.name === name);
      const isDirectory = mimeType === "application/vnd.google-apps.folder";

      // Store the Drive ID against the path of this item
      await set(id, path);

      // Is a Google Doc
      if (mimeType === "application/vnd.google-apps.document") {
        // Monitor this item for changes
        await setupWebhook(blogID, id);
      }

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          publish("Removing", path);
          const idToRemove = await get(path);
          await remove(idToRemove);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        } else if (!existsLocally) {
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          if (update) await update(path);
        }

        await walk(path, id);
      } else {
        const identicalOnRemote =
          existsLocally && existsLocally.md5Checksum === md5Checksum;

        if (existsLocally && !identicalOnRemote) {
          try {
            publish("Downloading", path);
            await download(blogID, drive, path, file);
            if (update) await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        } else if (!existsLocally) {
          try {
            publish("Downloading", path);
            await download(blogID, drive, path, file);
            if (update) await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        }
      }
    }
  };

  await walk("/", account.folderId);

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
    
    // we append the extension '.gdoc' to the name of the file
    // if it is a google doc
    items = items.concat(res.data.files.map((f) => {
      if (f.mimeType === "application/vnd.google-apps.document") {
        f.name += ".gdoc";
      }
      return f;
    }));

    nextPageToken = res.data.nextPageToken;
  } while (nextPageToken);

  return items;
};
