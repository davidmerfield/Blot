const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const Authorization = config.icloud.secret; // The Macserver Authorization secret from config
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = async (blogID, path) => {
  const pathOnDisk = localPath(blogID, path);
  const body = await fs.readFile(pathOnDisk);
  const modifiedTime = await fs.stat(pathOnDisk).mtime;

  const res = await fetch(`${MAC_SERVER_ADDRESS}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      Authorization, // Use the Authorization header
      blogID,
      path,
      modifiedTime,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload ${path}`);
  }

  return res.ok;
};
