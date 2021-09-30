const fs = require("fs-extra");
const localPath = require("helper/localPath");
const colors = require("colors/safe");
const join = require("path").join;
const debug = require("debug")("blot:clients:google-drive:sync");
const tempDir = require("helper/tempDir")();
const guid = require("helper/guid");
const determinePathInBlogFolder = require("./determinePathInBlogFolder");
const database = require("../database");
const computeMd5Checksum = require("../util/md5Checksum");

module.exports = async (drive, folder, blogID, fileId, target, account) => {
  return new Promise(async function (resolve, reject) {
    const {
      relativePath,
      md5Checksum,
      modifiedTime,
    } = await determinePathInBlogFolder(drive, fileId, account.folderID);

    const path = localPath(blogID, relativePath);
    const tempPath = join(tempDir, guid());

    debug("relativePath:", relativePath);
    debug("fullPath", path);
    debug("tempPath", tempPath);
    debug("fileId", fileId);
    debug("target", target);

    try {
      console.log("MIME TYPE", target.driveItem.mimeType);

      if (target.driveItem.mimeType === "application/vnd.google-apps.folder") {
        await fs.ensureDir(path);
        await database.storeFolder(blogID, { fileId, path: relativePath });
        debug("MKDIR folder");
        debug("   to:", colors.green(path));

        return resolve();
      }

      const existingMd5Checksum = await computeMd5Checksum(path);

      if (existingMd5Checksum && md5Checksum === existingMd5Checksum) {
        debug("DOWNLOAD file skipped because md5Checksum matches");
        debug("      path:", relativePath);
        debug("   locally:", existingMd5Checksum);
        debug("    remote:", md5Checksum);
        await database.storeFolder(blogID, { fileId, path: relativePath });
        return resolve();
      }

      debug("DOWNLOAD file");
      debug("   to:", colors.green(path));

      var dest = fs.createWriteStream(tempPath);

      debug("getting file from Drive");
      let data;

      if (
        target.driveItem.mimeType === "application/vnd.google-apps.document"
      ) {
        const res = await drive.files.export(
          {
            fileId: fileId,
            mimeType: "text/html",
          },
          { responseType: "stream" }
        );
        data = res.data;
      } else {
        const res = await drive.files.get(
          { fileId, alt: "media" },
          { responseType: "stream" }
        );
        data = res.data;
      }

      debug("got file from Drive");

      data
        .on("end", async () => {
          try {
            await fs.move(tempPath, path, { overwrite: true });
          } catch (e) {
            return reject(e);
          }

          try {
            debug("Setting mtime for file", path);
            debug("mtime before:", (await fs.stat(path)).mtime);
            const mtime = new Date(modifiedTime);
            debug("mtime to set:", mtime);
            await fs.utimes(path, mtime, mtime);
            debug("mtime after:", (await fs.stat(path)).mtime);
          } catch (e) {
            debug("Error setting mtime", e);
          }

          await database.storeFolder(blogID, { fileId, path: relativePath });
          await folder.update(relativePath);
          debug("DOWNLOAD file SUCCEEDED");
          resolve();
        })
        .on("error", reject)
        .pipe(dest);
    } catch (e) {
      debug("download error", e);
      reject(e);
    }
  });
};
