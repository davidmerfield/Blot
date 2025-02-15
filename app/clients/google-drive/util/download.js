const fs = require("fs-extra");
const localPath = require("helper/localPath");
const colors = require("colors/safe");
const join = require("path").join;
const debug = require("debug")("blot:clients:google-drive:sync");
const tempDir = require("helper/tempDir")();
const guid = require("helper/guid");
const computeMd5Checksum = require("../util/md5Checksum");

module.exports = async (blogID, drive, path, file) => {
  return new Promise(async function (resolve, reject) {
    let pathOnBlot = localPath(blogID, path);
    const tempPath = join(tempDir, guid());
    const { id, md5Checksum, mimeType, modifiedTime } = file;
    try {
      if (mimeType === "application/vnd.google-apps.folder") {
        await fs.ensureDir(pathOnBlot);
        debug("MKDIR folder");
        debug("   to:", colors.green(pathOnBlot));
        return resolve();
      }

      const existingMd5Checksum = await computeMd5Checksum(pathOnBlot);

      if (existingMd5Checksum && md5Checksum === existingMd5Checksum) {
        debug("DOWNLOAD file skipped because md5Checksum matches");
        debug("      path:", path);
        debug("   locally:", existingMd5Checksum);
        debug("    remote:", md5Checksum);
        return resolve();
      }

      debug("DOWNLOAD file");
      debug("   to:", colors.green(pathOnBlot));

      var dest = fs.createWriteStream(tempPath);

      debug("getting file from Drive");
      let data;

      // if the file is a google doc, then add the gdoc extension to pathOnBlot
      if (mimeType === "application/vnd.google-apps.document") {
        const res = await drive.files.export(
          {
            fileId: id,
            mimeType: "text/html",
          },
          { responseType: "stream" }
        );
        data = res.data;
      } else {
        const res = await drive.files.get(
          { fileId: id, alt: "media" },
          { responseType: "stream" }
        );
        data = res.data;
      }

      debug("got file from Drive");

      data
        .on("end", async () => {
          try {
            await fs.move(tempPath, pathOnBlot, { overwrite: true });
          } catch (e) {
            return reject(e);
          }

          try {
            debug("Setting mtime for file", pathOnBlot);
            debug("mtime before:", (await fs.stat(pathOnBlot)).mtime);
            const mtime = new Date(modifiedTime);
            debug("mtime to set:", mtime);
            await fs.utimes(pathOnBlot, mtime, mtime);
            debug("mtime after:", (await fs.stat(pathOnBlot)).mtime);
          } catch (e) {
            debug("Error setting mtime", e);
          }

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
