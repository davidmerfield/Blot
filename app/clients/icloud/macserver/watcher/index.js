const chokidar = require("chokidar");
const fs = require("fs-extra");
const { getLimiterForBlogID } = require("../limiters");
const { iCloudDriveDirectory } = require("../config");
const { constants } = require("fs");
const { join } = require("path");

const brctl = require("../brctl");

const status = require("../httpClient/status");
const upload = require("../httpClient/upload");
const mkdir = require("../httpClient/mkdir");
const remove = require("../httpClient/remove");

const isBlogDirectory = (name) => name.startsWith("blog_");

const {
  checkDiskSpace,
  removeBlog,
  addFile,
  removeFile,
} = require("./monitorDiskUsage");


// Map to track active chokidar watchers for each blog folder
const blogWatchers = new Map();

// Handle file events
const handleFileEvent = async (event, filePath, isInitialEvent) => {
  try {
    const relativePath = filePath.replace(`${iCloudDriveDirectory}/`, "");
    const [blogID, ...restPath] = relativePath.split("/");
    const pathInBlogDirectory = restPath.join("/");

    if (!blogID || !isBlogDirectory(blogID)) {
      console.warn(`Failed to parse blogID from path: ${filePath}`);
      return;
    }

    // Handle the deletion of the entire blog directory
    if (event === "unlinkDir" && pathInBlogDirectory === "") {
      console.warn(`Blog directory deleted: ${blogID}`);
      await status(blogID, { error: "Blog directory deleted" });
      await unwatch(blogID); // Stop watching this blog folder
      removeBlog(blogID); // Remove from largest files map
      return;
    }

    try {
      // Check if the directory for the blogID exists
      await fs.access(join(iCloudDriveDirectory, blogID), constants.F_OK);
    } catch (err) {
      console.warn(`Ignoring event for unregistered blogID: ${blogID}`);
      return;
    }

    if (event === "add" || event === "change") {
      const stats = await fs.stat(filePath);
      addFile(blogID, filePath, stats.size);
    } else if (event === "unlink") {
      removeFile(blogID, filePath);
    }

    // Skip processing the file event if it's part of the initial scan
    // othwerwise, we will re-upload all files on startup
    if (isInitialEvent) {
      return;
    }

    if (!pathInBlogDirectory) {
      console.warn(`Failed to parse path from path: ${filePath}`);
      return;
    }

    console.log(
      `Event: ${event}, blogID: ${blogID}, path: ${pathInBlogDirectory}`
    );

    // Get the limiter for this specific blogID
    const limiter = getLimiterForBlogID(blogID);

    // Schedule the event handler to run within the limiter
    await limiter.schedule(async () => {
      if (event === "add" || event === "change") {
        const stat = await brctl.download(filePath);
        const body = await fs.readFile(filePath);
        const modifiedTime = stat.mtime.toISOString();
        await upload(blogID, pathInBlogDirectory, body, modifiedTime);
      } else if (event === "unlink" || event === "unlinkDir") {
        await remove(blogID, pathInBlogDirectory);
      } else if (event === "addDir") {
        await mkdir(blogID, pathInBlogDirectory);
      }
    });
  } catch (error) {
    console.error(`Error handling file event (${event}, ${filePath}):`, error);
  }
};

// Initializes the top-level watcher and starts disk monitoring
const initializeWatcher = async () => {
  console.log(
    `Watching iCloud Drive directory for blog folders: ${iCloudDriveDirectory}`
  );

  // Start periodic disk space monitoring
  checkDiskSpace();
  
  // Top-level watcher to manage blog folder creation and deletion
  const topLevelWatcher = chokidar
    .watch(iCloudDriveDirectory, {
      depth: 0, // Only watch the top level
    })
    .on("addDir", (folderPath) => {
      const blogID = folderPath.replace(`${iCloudDriveDirectory}/`, "");
      if (isBlogDirectory(blogID)) {
        console.log(`Detected new blog folder: ${blogID}`);
        watch(blogID); // Add a watcher for the new blog folder
      } else {
        console.warn(`Ignoring non-blog folder: ${blogID}`);
      }
    })
    .on("unlinkDir", async (folderPath) => {
      const blogID = folderPath.replace(`${iCloudDriveDirectory}/`, "");
      if (isBlogDirectory(blogID)) {
        console.warn(`Blog folder removed: ${blogID}`);
        unwatch(blogID); // Remove the watcher for the deleted blog folder
        removeBlog(blogID); // Remove from largest files map
      } else {
        console.warn(`Ignoring non-blog folder: ${blogID}`);
      }
    });

  return topLevelWatcher;
};

// Watches a specific blog folder
const watch = async (blogID) => {
  if (blogWatchers.has(blogID)) {
    console.warn(`Already watching blog folder: ${blogID}`);
    return;
  }

  const blogPath = join(iCloudDriveDirectory, blogID);
  let initialScanComplete = false;

  console.log(`Starting watcher for blog folder: ${blogID}`);
  const watcher = chokidar
    .watch(blogPath, {
      ignoreInitial: false, // Process initial events
      ignored: /(^|[/\\])\../, // Ignore dotfiles
    })
    .on("all", (event, filePath) => {
      handleFileEvent(event, filePath, !initialScanComplete); // Pass a flag for initial events
    })
    .on("ready", () => {
      console.log(`Initial scan complete for blog folder: ${blogID}`);
      initialScanComplete = true; // Mark the initial scan as complete
    });

  blogWatchers.set(blogID, watcher);
};

// Unwatches a specific blog folder
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
