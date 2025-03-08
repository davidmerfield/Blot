const fs = require("fs-extra");
const { join } = require("path");
const { iCloudDriveDirectory } = require("../config");
const brctl = require('../brctl');

module.exports = async (req, res) => {
  const blogID = req.header("blogID");
  const path = Buffer.from(req.header("pathBase64"), "base64").toString("utf8");

  if (!blogID || !path) {
    return res.status(400).send("Missing blogID or path header");
  }

  console.log(`Received download request for blogID: ${blogID}, path: ${path}`);

  const filePath = join(iCloudDriveDirectory, blogID, path);

  // first download the file to make sure it's present on the local machine
  const stat = await brctl.download(filePath);

  // set the modifiedTime header to the file's modified time as an ISO string
  const modifiedTime = stat.mtime.toISOString();

  res.setHeader("modifiedTime", modifiedTime);

  res.download(filePath, path);
};
