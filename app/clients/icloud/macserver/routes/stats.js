const fs = require("fs-extra");
const brctl = require("../brctl");
const exec = require("util").promisify(require("child_process").exec);

const { iCloudDriveDirectory } = require("../config");

module.exports = async (req, res) => {
  const result = {};

  try {
    // get iCloud Drive free space in bytes
    result.icloud_bytes_available = await brctl.quota();
  } catch (error) {
    console.error(`Error getting iCloud Drive quota: ${error}`);
  }

  try {
    // get root disk free space in bytes
    const { stdout: diskFree, stderr: diskFreeErr } = await exec("df /");
    if (diskFreeErr) {
      console.error(`Error getting disk free space: ${diskFreeErr}`);
      return res.status(500).send(diskFreeErr);
    }

    result.disk_bytes_available = diskFree.split("\n")[1].split(/\s+/)[3];
  } catch (error) {
    console.error(`Error getting disk free space: ${error}`);
  }

  try {
    // get number of blogs connected
    const blogs = await fs.readdir(iCloudDriveDirectory, {
      withFileTypes: true,
    });

    result.blogs_connected = blogs.filter((blog) => blog.isDirectory()).length;
  } catch (error) {
    console.error(`Error getting number of blogs connected: ${error}`);
  }

  res.json(result);
};
