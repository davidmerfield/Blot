const fs = require("fs-extra");
const { join } = require("path");
const { iCloudDriveDirectory } = require("../config");

module.exports = async (req, res) => {
    const blogID = req.header("blogID");
    const path = req.header("path");

    // Validate required headers
    if (!blogID || !path) {
      return res.status(400).send("Missing required headers: blogID or path");
    }

    console.log(`Received delete request for blogID: ${blogID}, path: ${path}`);

    const filePath = join(iCloudDriveDirectory, blogID, path);

    for (let i = 0; i < 10; i++) {
      try {
        await fs.remove(filePath);
        console.log(`Deleted file: ${filePath}`);
        break;
      } catch (error) {
        console.error(`Failed to delete file (${filePath}):`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // Exponential backoff
      }
    }

    console.log(`Handled file deletion: ${filePath}`);

    res.sendStatus(200);
  }