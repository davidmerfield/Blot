const fs = require("fs-extra");
const { join } = require("path");
const { iCloudDriveDirectory } = require("../config");
const { watch, unwatch } = require("../watcher");

module.exports = async (req, res) => {
    const blogID = req.header("blogID");
    const path = Buffer.from(req.header("pathBase64"), "base64").toString("utf8");

    if (!blogID || !path) {
      return res.status(400).send("Missing blogID or path header");
    }

    console.log(`Received mkdir request for blogID: ${blogID}, path: ${path}`);

    const dirPath = join(iCloudDriveDirectory, blogID, path);
    const blogFolder = join(iCloudDriveDirectory, blogID);

    // first unwatch the blogID to prevent further events from being triggered
    unwatch(blogFolder);
    
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


  // re-watch the blogID
  watch(blogFolder);

    console.log(`Created directory: ${dirPath}`);
    res.sendStatus(200);
  }