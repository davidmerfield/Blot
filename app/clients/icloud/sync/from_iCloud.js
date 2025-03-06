const fs = require("fs-extra");
const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const download = require("./util/download");
const CheckWeCanContinue = require("./util/checkWeCanContinue");
const truncateToSecond = require("./util/truncateToSecond");
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

    for (const { name } of localContents) {
      if (!remoteContents.find((item) => item.name === name)) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing local item", join(dir, name));
        await fs.remove(localPath(blogID, path));
        await update(path);
      }
    }

    for (const {
      name,
      md5Checksum,
      isDirectory,
      modifiedTime,
    } of remoteContents) {
      const path = join(dir, name);
      const existsLocally = localContents.find((item) => item.name === name);

      if (isDirectory) {
        if (existsLocally && !existsLocally.isDirectory) {
          await checkWeCanContinue();
          publish("Removing", path);
          await fs.remove(localPath(blogID, path));
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        } else if (!existsLocally) {
          await checkWeCanContinue();
          publish("Creating directory", path);
          await fs.ensureDir(localPath(blogID, path));
          await update(path);
        }

        await walk(path);
      } else {
        const identicalOnRemote =
          existsLocally &&
          existsLocally.md5Checksum === md5Checksum &&
          truncateToSecond(existsLocally.modifiedTime) === truncateToSecond(modifiedTime);

        if (existsLocally && !identicalOnRemote) {
          try {
            await checkWeCanContinue();
            publish("Updating", path);
            await download(blogID, path);
            await update(path);
          } catch (e) {
            publish("Failed to download", path, e);
          }
        } else if (!existsLocally) {
          try {
            await checkWeCanContinue();
            publish("Downloading", path);
            await download(blogID, path);
            await update(path);
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
