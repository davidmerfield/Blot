const fs = require("fs-extra");
const { join } = require("path");
const { iCloudDriveDirectory } = require("../config");
const getmd5Checksum = require("../../sync/util/md5Checksum");

module.exports = async (req, res) => {
  const blogID = req.header("blogID");
  const path = Buffer.from(req.header("pathBase64"), "base64").toString("utf8");

  if (!blogID || !path) {
    return res.status(400).send("Missing blogID or path header");
  }

  console.log(`Received readdir request for blogID: ${blogID}, path: ${path}`);

  const dirPath = join(iCloudDriveDirectory, blogID, path);
  const files = await fs.readdir(dirPath, { withFileTypes: true });

  const result = [];

  for (const file of files) {
    const filePath = join(dirPath, file.name);
    const [md5Checksum, stat] = await Promise.all([
      file.isDirectory() ? undefined : getmd5Checksum(filePath),
      fs.stat(filePath),
    ]);

    const modifiedTime = stat.mtime.toISOString();
    const isDirectory = file.isDirectory();

    result.push({
      name: file.name.normalize("NFC"),
      isDirectory,
      md5Checksum: isDirectory ? undefined : md5Checksum,
      modifiedTime: isDirectory ? undefined : modifiedTime,
    });
  }

  console.log(`Readdir complete for blogID: ${blogID}, path: ${path}`);
  console.log(result);
  res.json(result);
};
