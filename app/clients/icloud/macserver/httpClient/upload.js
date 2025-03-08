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

module.exports = async (...args) => {
  const [blogID, path] = args;

  if (!blogID || typeof blogID !== "string") {
    throw new Error("Invalid blogID");
  }

  if (!path || typeof path !== "string") {
    throw new Error("Invalid path");
  }

  if (args.length !== 2) {
    throw new Error("Invalid number of arguments: expected 2");
  }

  const filePath = join(iCloudDriveDirectory, blogID, path);
  const stat = await brctl.download(filePath);

  if (stat.size > maxFileSize) {
    throw new Error(
      `File size exceeds maximum allowed size: ${maxFileSize} bytes`
    );
  }

  const modifiedTime = stat.mtime.toISOString();
  const body = fs.createReadStream(filePath);

  const pathBase64 = Buffer.from(path).toString("base64");

  await fetch(`${remoteServer}/upload`, {
    method: "POST",
    duplex: true,
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization,
      blogID,
      pathBase64,
      modifiedTime,
    },
    body,
  });

  console.log(`Upload successful`);
};
