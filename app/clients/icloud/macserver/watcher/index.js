const chokidar = require("chokidar");
const fs = require("fs-extra");
const { constants } = require("fs-extra");
const { join } = require("path");
const { getLimiterForBlogID } = require("../limiters");
const { iCloudDriveDirectory } = require("../config");
const isBlogDirectory = (name) => name.startsWith("blog_");
const brctl = require("../brctl");

const status = require("../httpClient/status");
const upload = require("../httpClient/upload");
const mkdir = require("../httpClient/mkdir");
const remove = require("../httpClient/remove");

// Map to track active chokidar watchers for each blog folder
const blogWatchers = new Map();

const handleFileEvent = async (event, filePath) => {
  try {
    const relativePath = filePath.replace(`${iCloudDriveDirectory}/`, "");
    const [blogID, ...restPath] = relativePath.split("/");
    const path = restPath.join("/");

    if (!blogID || !isBlogDirectory(blogID)) {
      console.warn(`Failed to parse blogID from path: ${filePath}`);
      return;
    }

    // Handle the deletion of the entire blog directory
    if (event === "unlinkDir" && path === "") {
      console.warn(`Blog directory deleted: ${blogID}`);
      await status(blogID, { error: "Blog directory deleted" });
      await unwatch(blogID); // Stop watching this blog folder
      return;
    }

    try {
      // Check if the directory for the blogID exists
      await fs.access(join(iCloudDriveDirectory, blogID), constants.F_OK);
    } catch (err) {
      console.warn(`Ignoring event for unregistered blogID: ${blogID}`);
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

const initializeWatcher = () => {
  console.log(`Watching iCloud Drive directory for blog folders: ${iCloudDriveDirectory}`);

  // Top-level watcher to manage blog folder creation and deletion
  const topLevelWatcher = chokidar
    .watch(iCloudDriveDirectory, {
      depth: 1,
      ignoreInitial: true,
      usePolling: false,
    })
    .on("addDir", async (folderPath) => {
      const folderName = folderPath.replace(`${iCloudDriveDirectory}/`, "");
      if (isBlogDirectory(folderName)) {
        console.log(`Detected new blog folder: ${folderName}`);
        await watch(folderName); // Add a watcher for the new blog folder
      }
    })
    .on("unlinkDir", async (folderPath) => {
      const folderName = folderPath.replace(`${iCloudDriveDirectory}/`, "");
      if (isBlogDirectory(folderName)) {
        console.warn(`Blog folder removed: ${folderName}`);
        await unwatch(folderName); // Remove the watcher for the deleted blog folder
      }
    });

  return topLevelWatcher;
};

const watch = async (blogID) => {
  if (blogWatchers.has(blogID)) {
    console.warn(`Already watching blog folder: ${blogID}`);
    return;
  }

  const blogPath = join(iCloudDriveDirectory, blogID);

  console.log(`Starting watcher for blog folder: ${blogID}`);
  const watcher = chokidar
    .watch(blogPath, {
      ignoreInitial: true,
      usePolling: false,
      ignored: /(^|[/\\])\../, // Ignore dotfiles
    })
    .on("all", async (event, filePath) => {
      await handleFileEvent(event, filePath);
    });

  blogWatchers.set(blogID, watcher);
};

const unwatch = async (blogID) => {
  const watcher = blogWatchers.get(blogID);
  if (!watcher) {
    console.warn(`No active watcher for blog folder: ${blogID}`);
    return;
  }

  console.log(`Stopping watcher for blog folder: ${blogID}`);
  await watcher.close();
  blogWatchers.delete(blogID);
};

module.exports = { initializeWatcher, unwatch, watch };