const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const database = require("../database");
const createDriveClient = require("../util/createDriveClient");
const getmd5Checksum = require("../util/md5Checksum");

module.exports = async (blogID, publish) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " Google Drive:", args.join(" "));
    };

  const { drive, account } = await createDriveClient(blogID);
  const { folderId } = account;

  const checkWeCanContinue = async () => {
    if ((await database.getAccount(blogID)).preparing !== account.preparing)
      throw new Error("Permission to continue verification changed");
  };

  const { reset, set } = database.folder(folderId);

  // reset pageToken
  // reset db.folder state
  await reset();

  const walk = async (dir, dirId) => {
    await checkWeCanContinue();
    publish("Checking", dir);

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
        publish("Removing", join(dir, name));
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
          publish("Removing", path);
          await drive.files.delete({ fileId: existsOnRemote.id });
          publish("Creating directory", path);
          pathId = await mkdir(drive, dirId, name);
        } else if (existsOnRemote && existsOnRemote.id) {
          pathId = existsOnRemote.id;
        } else {
          publish("Creating directory", path);
          pathId = await mkdir(drive, dirId, name);
        }

        await walk(path, pathId);
      } else {
        const identicalOnRemote =
          existsOnRemote && existsOnRemote.md5Checksum === md5Checksum;

        if (existsOnRemote && !identicalOnRemote) {
          publish("Updating", path);
          set(existsOnRemote.id, path);
          await drive.files.update({
            fileId: existsOnRemote.id,
            media: {
              body: fs.createReadStream(localPath(blogID, path)),
            },
          });
        } else if (!existsOnRemote) {
          publish("Transferring", path);
          const { data } = await drive.files.create({
            resource: {
              name,
              parents: [dirId],
            },
            media: {
              body: fs.createReadStream(localPath(blogID, path)),
            },
            fields: "id",
          });
          set(data.id, path);
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

const mkdir = async (drive, parentId, name) => {
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
