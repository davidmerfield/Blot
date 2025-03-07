const fs = require("fs-extra");
const { join } = require("path");
const download = require('../brctl/download');
const { iCloudDriveDirectory, remoteServer, Authorization } = require("../config");

module.exports = async (blogID, path) => {
  console.log(`Issuing external upload for blogID: ${blogID}, path: ${path}`);

  const filePath = join(iCloudDriveDirectory, blogID, path);

  let body;
  let modifiedTime;

  for (let i = 0; i < 10; i++) {
    try {
      // ensure the file is downloaded from iCloud Drive before uploading
      await download(filePath);

      console.log(`Reading file: ${filePath}`);
      body = await fs.readFile(filePath);
      modifiedTime = (await fs.stat(filePath)).mtime.toISOString();

      break;
    } catch (error) {
      console.error(`Failed to read file (${filePath}):`, error);
      await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // Exponential backoff
    }
  }

  if (!body) {
    console.error(`Failed to read file (${filePath}) after 5 attempts`);
    return;
  }

  const res = await fetch(`${remoteServer}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization,
      blogID,
      path,
      modifiedTime,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  console.log(`Upload successful: ${await res.text()}`);
};
