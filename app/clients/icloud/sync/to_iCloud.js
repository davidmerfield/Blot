const { join } = require("path");
const localPath = require("helper/localPath");
const clfdate = require("helper/clfdate");
const CheckWeCanContinue = require("./util/checkWeCanContinue");
const remoteUpload = require("./util/remoteUpload");
const remoteMkdir = require("./util/remoteMkdir");
const remoteDelete = require("./util/remoteDelete");
const localReaddir = require("./util/localReaddir");
const remoteReaddir = require("./util/remoteReaddir");
const truncateToSecond = require("./util/truncateToSecond");

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
      if (!localContents.find((item) => item.name.normalize("NFC") === name.normalize("NFC"))) {
        const path = join(dir, name);
        await checkWeCanContinue();
        publish("Removing remote item", join(dir, name));
        await remoteDelete(blogID, path);
      }
    }

    for (const {
      name,
      size,
      isDirectory,
      modifiedTime,
    } of localContents) {

      const path = join(dir, name);
      const existsRemotely = remoteContents.find((item) => item.name.normalize("NFC") === name.normalize("NFC"));

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
          existsRemotely.size === size &&
          truncateToSecond(existsRemotely.modifiedTime) === truncateToSecond(modifiedTime);

        if (existsRemotely && !identicalOnRemote) {
          try {
            await checkWeCanContinue();
            publish("Updating", path);
            await remoteUpload(blogID, path);
          } catch (e) {
            publish("Failed to upload", path, e);
          }
        } else if (!existsRemotely) {
          try {
            await checkWeCanContinue();
            publish("Transferring", path);
            await remoteUpload(blogID, path);
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
