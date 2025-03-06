const config = require("config");
const MAC_SERVER_ADDRESS = config.icloud.server_address;
const MACSERVER_AUTH = config.icloud.secret; // The Macserver Authorization secret from config
const localPath = require("helper/localPath");
const fs = require("fs-extra");

module.exports = async (blogID, path) => {
  const res = await fetch(MAC_SERVER_ADDRESS + "/download", {
    headers: { Authorization: MACSERVER_AUTH, blogID: blogID, path: path },
  });

  // the modifiedTime header is sent by the server
  const modifiedTime = res.headers.get("modifiedTime");
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const pathOnDisk = localPath(blogID, path);
  await fs.outputFile(pathOnDisk, buffer);
  await fs.utimes(pathOnDisk, new Date(modifiedTime), new Date(modifiedTime));
  return pathOnDisk;
};
