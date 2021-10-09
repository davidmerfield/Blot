const fs = require("fs-extra");
const clfdate = require("helper/clfdate");
const { join } = require("path");
const database = require("../database");
const createDriveClient = require("./createDriveClient");
const getmd5Checksum = require("./md5Checksum");
const localPath = require("helper/localPath");

module.exports = async (blogID) => {
  const prefix = () => clfdate() + " Google Drive:";
  const { drive, account } = await createDriveClient(blogID);
  const { folderId } = account;

  const checkWeCanContinue = async () => {
    if ((await database.getAccount(blogID)).settingUp !== account.settingUp)
      throw new Error("Permission to continue verification changed");
  };

  const { reset, set } = database.folder(folderId);

  await reset();

  // reset pageToken
  // reset db.folder state

  const walk = async (dir, dirId) => {
    await checkWeCanContinue();
    console.log(prefix(), "Walking", dir);

    const [remoteContents, localContents] = await Promise.all([
      readdir(drive, dirId),
      localreaddir(localPath(blogID, dir)),
    ]);

    // Since we reset the database of file ids
    // we need to restore this now
    set(dirId, dir);

    for (const { name, id } of remoteContents) {
      if (!localContents.find((item) => item.name === name)) {
        await checkWeCanContinue();
        console.log(prefix(), "- REMOVE", join(dir, name), id, "from DRIVE");
        await drive.files.delete({ fileId: id });
      }
    }

    for (const { name, isDirectory, md5Checksum } of localContents) {
      const path = join(dir, name);
      const existsOnRemote = remoteContents.find((f) => f.name === name);
      await checkWeCanContinue();

      if (isDirectory) {
        let pathId;

        if (
          existsOnRemote &&
          existsOnRemote.mimeType !== "application/vnd.google-apps.folder"
        ) {
          console.log(prefix(), "- REMOVE", path, "from DRIVE");
          await drive.files.delete({ fileId: existsOnRemote.id });
          pathId = await mkdir(prefix, drive, dirId, name);
        } else if (existsOnRemote && existsOnRemote.id) {
          pathId = existsOnRemote.id;
        } else {
          pathId = await mkdir(prefix, drive, dirId, name);
        }

        await walk(path, pathId);
      } else {
        const identicalOnRemote =
          existsOnRemote && existsOnRemote.md5Checksum === md5Checksum;

        if (existsOnRemote && !identicalOnRemote) {
          console.log(prefix(), "- UPDATE", name, "at", existsOnRemote.id);
          set(existsOnRemote.id, path);
          await drive.files.update({
            fileId: existsOnRemote.id,
            media: {
              body: fs.createReadStream(localPath(blogID, path)),
            },
          });
        } else if (!existsOnRemote) {
          console.log(prefix(), "- CREATE", name, "inside", dirId);
          const id = await drive.files.create({
            resource: {
              name,
              parents: [dirId],
            },
            media: {
              body: fs.createReadStream(localPath(blogID, path)),
            },
            fields: "id",
          });
          set(id, path);
        }
      }
    }
  };

  await walk("/", folderId);

  // set newPageToken
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


const mkdir = async (prefix, drive, parentId, name) => {
  console.log(prefix(), "- MKDIR", name, "in parentId", parentId);

  const res = await drive.files.create({
    resource: {
      name,
      parents: [parentId],
      mimeType: "application/vnd.google-apps.folder",
    },
    fields: "id, name",
  });

  return res.data.id;
};
