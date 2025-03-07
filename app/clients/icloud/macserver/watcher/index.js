const chokidar = require("chokidar");

const fs = require("fs-extra");
const { join } = require("path");
const { getLimiterForBlogID } = require("../limiters");
const { iCloudDriveDirectory } = require("../config");
const isBlogDirectory = (name) => name.startsWith("blog_");
const brctl = require('../brctl');

const status =  require("../httpClient/status");
const upload = require("../httpClient/upload");
const mkdir = require("../httpClient/mkdir");
const remove = require("../httpClient/remove");
const { error } = require("console");

/**
 * Handle file events from chokidar and interact with remote server.
 * @param {string} event - The file event (add, change, unlink, etc.)
 * @param {string} filePath - The full path of the file triggering the event
 */
const handleFileEvent = async (event, filePath) => {
  try {
    const relativePath = filePath.replace(`${iCloudDriveDirectory}/`, "");
    const [blogID, ...restPath] = relativePath.split("/");
    // handle paths with special characters e.g. umlauts
    const path = restPath.join("/").normalize("NFC");

    if (!blogID) {
      console.warn(`Failed to parse blogID from path: ${filePath}`);
      return;
    }

    if (!isBlogDirectory(blogID) || !fs.existsSync(join(iCloudDriveDirectory, blogID))) {
      console.warn(`Ignoring event for unregistered blogID: ${blogID}`);
      return;
    }

    // handle the deletion of the entire blog directory
    if (event === "unlinkDir" && path === "") {
      console.warn(`Blog directory deleted: ${blogID}`);
      await status(blogID, {error: "Blog directory deleted"});
      return;
    }

    if (!path) {
      console.warn(`Failed to parse path from path: ${filePath}`);
      return;
    }

    console.log(`Event: ${event}, blogID: ${blogID}, path: ${path}`);

    // Get the limiter for this specific blogID
    const limiter = getLimiterForBlogID(blogID);

    // Schedule the event handler to run within the limiter
    await limiter.schedule(async () => {
      if (event === "add" || event === "change") {
        const stat = await brctl.download(filePath);
        const body = await fs.readFile(filePath);
        const modifiedTime = stat.mtime.toISOString();
        await upload(blogID, path, body, modifiedTime);      
      } else if (event === "unlink" || event === "unlinkDir") {
        await remove(blogID, path);
      } else if (event === "addDir") {
        await mkdir(blogID, path);
      }
    });
  } catch (error) {
    console.error(`Error handling file event (${event}, ${filePath}):`, error);
  }
};

let watcher;

/**
 * Initialize chokidar to watch the iCloud Drive directory.
 */
const initializeWatcher = () => {
  console.log(`Watching iCloud Drive directory: ${iCloudDriveDirectory}`);

  watcher = chokidar
    .watch(iCloudDriveDirectory, {
      ignoreInitial: true,
      // emit single event when chunked writes are completed
      // Was designed to solve this error:
      // Error handling file event (add, /Users/admin/Library/Mobile Documents/com~apple~Cloud
      // errno: -11,
      // code: 'Unknown system error -11',
      // syscall: 'read'
      // which occurs when the file is only partially written
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 50,
      },
    })
    .on("all", async (event, filePath) => {
      await handleFileEvent(event, filePath);
    });
};

const unwatch = (path) => {
  watcher.unwatch(path);
}

const watch = (path) => {
  watcher.add(path);
}

module.exports = { initializeWatcher, unwatch, watch };
