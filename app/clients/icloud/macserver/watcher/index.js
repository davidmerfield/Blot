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

const handleFileEvent = async (event, filePath) => {
  try {
    const relativePath = filePath.replace(`${iCloudDriveDirectory}/`, "");
    const [blogID, ...restPath] = relativePath.split("/");
    const path = restPath.join("/");

    if (!blogID || !isBlogDirectory(blogID)) {
      console.warn(`Failed to parse blogID from path: ${filePath}`);
      return;
    }

    // handle the deletion of the entire blog directory
    if (event === "unlinkDir" && path === "") {
      console.warn(`Blog directory deleted: ${blogID}`);
      await status(blogID, { error: "Blog directory deleted" });
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

let watcher;

const initializeWatcher = () => {
  console.log(`Watching iCloud Drive directory: ${iCloudDriveDirectory}`);

  watcher = chokidar
    .watch(iCloudDriveDirectory, {
      // watch for add, change, unlink, unlinkDir events after initial scan
      ignoreInitial: true,
      // apparently polling causes poor performance
      usePolling: false,
      // ignore dotfiles
      ignore: /(^|[/\\])\../,
    })
    .on("all", async (event, filePath) => {
      await handleFileEvent(event, filePath);
    });
};

const unwatch = async (path) => {
  if (!path.startsWith(iCloudDriveDirectory)) {
    console.warn(
      `Ignoring unwatch request for path outside of iCloud Drive: ${path}`
    );
    return;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "");

  console.log(`Unwatching path: ${pathInDrive}`);
  await watcher.unwatch(pathInDrive);
};

const watch = async (path) => {
  if (!path.startsWith(iCloudDriveDirectory)) {
    console.warn(
      `Ignoring watch request for path outside of iCloud Drive: ${path}`
    );
    return;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "");

  console.log(`Watching path: ${pathInDrive}`);

  await watcher.add(pathInDrive);
};

module.exports = { initializeWatcher, unwatch, watch };
