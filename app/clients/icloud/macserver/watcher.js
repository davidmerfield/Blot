const exec = require("util").promisify(require("child_process").exec);
const chokidar = require("chokidar");
const fs = require("fs-extra");

const { getLimiterForBlogID } = require("./limiters");
const { remoteServer, iCloudDriveDirectory, Authorization } = require("./config");

const isBlogDirectory = (name) => name.startsWith("blog_");

/**
 * Handle file events from chokidar and interact with remote server.
 * @param {string} event - The file event (add, change, unlink, etc.)
 * @param {string} filePath - The full path of the file triggering the event
 */
const handleFileEvent = async (event, filePath) => {
  try {
    // handle paths with special characters e.g. umlauts
    const normalizedFilePath = filePath.normalize("NFC");
    const relativePath = normalizedFilePath.replace(
      `${iCloudDriveDirectory}/`,
      ""
    );
    const [blogID, ...restPath] = relativePath.split("/");
    const path = restPath.join("/");

    if (!blogID || !path) {
      console.warn(`Invalid path: blogID or path is missing (${filePath})`);
      return;
    }

    if (!isBlogDirectory(blogID)) {
      console.warn(`Ignoring event for unregistered blogID: ${blogID}`);
      return;
    }

    console.log(`Event: ${event}, blogID: ${blogID}, path: ${path}`);

    // Get the limiter for this specific blogID
    const limiter = getLimiterForBlogID(blogID);

    // Schedule the event handler to run within the limiter
    await limiter.schedule(async () => {
      if (event === "add" || event === "change") {
        console.log(
          `Issuing external upload for blogID: ${blogID}, path: ${path}`
        );
        let body;
        let modifiedTime;
        for (let i = 0; i < 10; i++) {
          try {
            // brctl download /path/to/file.txt
            console.log(`Downloading file: ${filePath}`);
            const { stdout, stderr } = await exec(
              `brctl download "${relativePath}"`,
              { cwd: iCloudDriveDirectory }
            );
            console.log("stdout:", stdout);
            console.log("stderr:", stderr);

            console.log(`Reading file: ${filePath}`);
            body = await fs.readFile(filePath);
            modifiedTime = (await fs.stat(filePath)).mtime.toISOString();

            break;
          } catch (error) {
            console.error(`Failed to read file (${filePath}):`, error);
            await new Promise((resolve) => setTimeout(resolve, 1000 * i)); // Exponential backoff
          }
        }

        if (!body) {
          console.error(`Failed to read file (${filePath}) after 5 attempts`);
          return;
        }

        const res = await fetch(`${remoteServer}/upload`, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Authorization, // Use the Authorization header
            blogID,
            path,
            modifiedTime,
          },
          body,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        console.log(`Upload successful: ${await res.text()}`);
      } else if (event === "unlink" || event === "unlinkDir") {
        console.log(
          `Issuing external delete for blogID: ${blogID}, path: ${path}`
        );
        const res = await fetch(`${remoteServer}/delete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization, // Use the Authorization header
            blogID,
            path,
          },
        });

        if (!res.ok) {
          throw new Error(`Delete failed: ${res.statusText}`);
        }

        console.log(`Delete successful: ${await res.text()}`);
      } else if (event === "addDir") {
        console.log(
          `Issuing external mkdir for blogID: ${blogID}, path: ${path}`
        );
        const res = await fetch(`${remoteServer}/mkdir`, {
          method: "POST",
          headers: {
            Authorization, // Use the Authorization header
            blogID,
            path,
          },
        });

        if (!res.ok) {
          throw new Error(`Mkdir failed: ${res.statusText}`);
        }

        console.log(`Issuing external mkdir successful: ${await res.text()}`);
      }
    });
  } catch (error) {
    console.error(`Error handling file event (${event}, ${filePath}):`, error);
  }
};

/**
 * Initialize chokidar to watch the iCloud Drive directory.
 */
const initializeWatcher = () => {
  console.log(`Watching iCloud Drive directory: ${iCloudDriveDirectory}`);

  chokidar
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