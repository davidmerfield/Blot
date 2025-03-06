const util = require("util");
const exec = util.promisify(require("child_process").exec);
const fs = require("fs-extra");
const { iCloudDriveDirectory } = require("../config");

module.exports = async (req, res) => {
    const result = {};

    // use brctl quota to get the iCloud Drive quota and usage
    // e.g. '1899909948243 bytes of quota remaining in personal account'
    const { stdout: quota, stderr: quotaErr } = await exec("brctl quota");
    if (quotaErr) {
      console.error(`Error getting iCloud Drive quota: ${quotaErr}`);
      return res.status(500).send(quotaErr);
    }

    result.icloud_bytes_available = quota.match(
      /(\d+) bytes of quota remaining/
    )[1];

    // get root disk free space on the mac as a whole in bytes
    const { stdout: diskFree, stderr: diskFreeErr } = await exec("df /");
    if (diskFreeErr) {
      console.error(`Error getting disk free space: ${diskFreeErr}`);
      return res.status(500).send(diskFreeErr);
    }

    result.disk_bytes_available = diskFree.split("\n")[1].split(/\s+/)[3];

    // get number of blogs connected
    const blogs = await fs.readdir(iCloudDriveDirectory, {
      withFileTypes: true,
    });

    result.blogs_connected = blogs.filter((blog) => blog.isDirectory()).length;

    res.json(result);
  }