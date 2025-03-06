const fs = require("fs-extra");
const { join } = require("path");
const { iCloudDriveDirectory } = require("../config");

module.exports = async (req, res) => {
    const blogID = req.header("blogID");
    const path = req.header("path");

    if (!blogID || !path) {
      return res.status(400).send("Missing blogID or path header");
    }

    console.log(`Received mkdir request for blogID: ${blogID}, path: ${path}`);

    const dirPath = join(iCloudDriveDirectory, blogID, path);

    for (let i = 0; i < 10; i++) {
      try {
        await fs.ensureDir(dirPath);
        console.log(`Created directory: ${dirPath}`);
        break;
      } catch (error) {
        console.error(`Failed to create directory (${dirPath}):`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // Exponential backoff
      }
    }

    console.log(`Created directory: ${dirPath}`);
    res.sendStatus(200);
  }