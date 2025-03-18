const {
  remoteServer,
  Authorization,
  iCloudDriveDirectory,
  maxFileSize,
} = require("../config");

const fs = require("fs-extra");
const brctl = require("../brctl");
const fetch = require("./rateLimitedFetchWithRetriesAndTimeout");
const { join } = require("path");

module.exports = (...args) =>
  new Promise(async (resolve, reject) => {
    const [blogID, path] = args;

    if (!blogID || typeof blogID !== "string") {
      return reject(new Error("Invalid blogID"));
    }

    if (!path || typeof path !== "string") {
      return reject(new Error("Invalid path"));
    }

    if (args.length !== 2) {
      return reject(new Error("Invalid number of arguments: expected 2"));
    }

    const filePath = join(iCloudDriveDirectory, blogID, path);
    let stat;

    try {
      stat = await brctl.download(filePath);
    } catch (e) {
      return reject(new Error(`Download failed: ${e.message}`));
    }

    if (stat.size > maxFileSize) {
      return reject(
        new Error(`File size exceeds maximum of ${maxFileSize} bytes`)
      );
    }

    const modifiedTime = stat.mtime.toISOString();

    console.log(`Creating read stream to file: ${filePath}`);

    body = fs.createReadStream(filePath);

    body.on("error", (error) => {
      body.destroy();
      reject(new Error(`Read stream error: ${error.message}`));
    });

    const pathBase64 = Buffer.from(path).toString("base64");

    console.log(`Issuing HTTP /upload request to remote server: ${path}`);

    try {
      await fetch(`${remoteServer}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization,
          blogID,
          pathBase64,
          modifiedTime,
        },
        body,
        duplex: "half",
      });
      resolve();
    } catch (error) {
      reject(new Error(`HTTP /upload request failed: ${error.message}`));
    }
  });
