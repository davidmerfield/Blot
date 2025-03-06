const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const upload = require("./util/upload");
const CheckWeCanContinue = require("./util/checkWeCanContinue");
const remoteMkdir = require("./util/remoteMkdir");
const remoteDelete = require("./util/remoteDelete");
const localReaddir = require("./util/localReaddir");
const remoteReaddir = require("./util/remoteReaddir");

module.exports = async (blogID, publish, update) => {
  if (!publish)
    publish = (...args) => {
      console.log(clfdate() + " iCloud:", args.join(" "));
    };

  if (!update) update = () => {};

  const checkWeCanContinue = CheckWeCanContinue(blogID);

  const walk = async (dir) => {
    publish("Checking", dir);

    const [remoteContents, localContents] = await Promise.all([
      remoteReaddir(blogID, dir),
      localReaddir(localPath(blogID, dir)),
    ]);

    for (const { name } of remoteContents) {
      if (name === ".DS_Store") {
        continue;
      }

      if (!localContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing remote item", join(dir, name));
        await remoteDelete(blogID, path);
      }
    }

    for (const {
      name,
      md5Checksum,
      isDirectory,
      modifiedTime,
    } of localContents) {
      if (name === ".DS_Store") {
        continue;
      }

      const path = join(dir, name);
      const existsRemotely = remoteContents.find((item) => item.name === name);

      if (isDirectory) {
        if (existsRemotely && !existsRemotely.isDirectory) {
          await checkWeCanContinue();
          publish("Removing", path);
          await remoteDelete(blogID, path);
          publish("Creating directory", path);
          await remoteMkdir(blogID, path);
        } else if (!existsRemotely) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          await remoteMkdir(blogID, path);
        }

        await walk(path);
      } else {
        const identicalOnRemote =
          existsRemotely &&
          existsRemotely.md5Checksum === md5Checksum &&
          existsRemotely.modifiedTime === modifiedTime;

        if (existsRemotely && !identicalOnRemote) {
          try {
            await checkWeCanContinue();
            publish("Uploading", path);
            await upload(blogID, path);
          } catch (e) {
            publish("Failed to upload", path, e);
          }
        } else if (!existsRemotely) {
          try {
            await checkWeCanContinue();
            publish("Uploading", path);
            await upload(blogID, path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        }
      }
    }
  };

  try {
    await walk("/");
  } catch (err) {
    publish("Sync failed", err.message);
    // Possibly rethrow or handle
  }
};
