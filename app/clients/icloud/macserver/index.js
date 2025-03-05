require("dotenv").config();

const express = require("express");
const exec = require("util").promisify(require("child_process").exec);
const chokidar = require("chokidar");
const fs = require("fs-extra");
const path = require("path");
const acceptSharingLink = require("./acceptSharingLink");

const remoteServer = process.env.REMOTE_SERVER;
const iCloudDriveDirectory = process.env.ICLOUD_DRIVE_DIRECTORY;
const Authorization = process.env.BLOT_ICLOUD_SERVER_SECRET; // Use the correct environment variable

const isBlogDirectory = (name) => name.startsWith("blog_");

if (!remoteServer) {
  throw new Error("REMOTE_SERVER is not set");
}

if (!iCloudDriveDirectory) {
  throw new Error("ICLOUD_DRIVE_DIRECTORY is not set");
}

if (!Authorization) {
  throw new Error("BLOT_ICLOUD_SERVER_SECRET is not set");
}

// verify we can read, write and delete files 
fs.access(iCloudDriveDirectory, fs.constants.R_OK | fs.constants.W_OK | fs.constants.X_OK)
    .then(() => console.log(`Directory ${iCloudDriveDirectory} is accessible`))
    .catch((err) => {
        console.error(`Directory ${iCloudDriveDirectory} is not accessible:`, err);
        process.exit(1);
    });


/**
 * Ping the remote server to ensure it's reachable.
 */
const ping = async () => {
  try {
    const res = await fetch(remoteServer + "/ping", {
      headers: {
        Authorization, // Use the Authorization header
      },
    });

    if (!res.ok) {
      throw new Error(`Ping failed: ${res.statusText}`);
    }

    const text = await res.text();
    console.log(`Ping response: ${text}`);
    return text;
  } catch (error) {
    console.error("Error pinging remote server:", error);
  }
};



const Bottleneck = require("bottleneck");

// Create a map of limiters, one per blogID
const limiters = new Map();

/**
 * Get or create a Bottleneck limiter for a specific blogID.
 * Each blogID gets its own limiter to ensure events are processed sequentially.
 * @param {string} blogID - The blog ID for which to get the limiter.
 * @returns {Bottleneck} The Bottleneck limiter for the blogID.
 */
const getLimiterForBlogID = (blogID) => {
  if (!limiters.has(blogID)) {
    // Create a new limiter for this blogID with concurrency of 1
    const limiter = new Bottleneck({
      maxConcurrent: 1, // Only one task per blogID can run at a time
    });
    limiters.set(blogID, limiter);
  }
  return limiters.get(blogID);
};

/**
 * Handle file events from chokidar and interact with remote server.
 * @param {string} event - The file event (add, change, unlink, etc.)
 * @param {string} filePath - The full path of the file triggering the event
 */
const handleFileEvent = async (event, filePath) => {
  try {
    // handle paths with special characters e.g. umlauts
    const normalizedFilePath = filePath.normalize("NFC");
    const relativePath = normalizedFilePath.replace(`${iCloudDriveDirectory}/`, "");
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
        let body;
        for (let i = 0; i < 10; i++) {
          try {
            // brctl download /path/to/file.txt
            console.log(`Downloading file: ${filePath}`);
            const { stdout, stderr } = await exec(`brctl download "${relativePath}"`, { cwd: iCloudDriveDirectory });
            console.log('stdout:', stdout);
            console.log('stderr:', stderr);

            console.log(`Reading file: ${filePath}`);
            body = await fs.readFile(filePath);
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
          },
          body,
        });

        if (!res.ok) {
          throw new Error(`Upload failed: ${res.statusText}`);
        }

        console.log(`Upload successful: ${await res.text()}`);
      } else if (event === "unlink" || event === "unlinkDir") {
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
      }
    });
  } catch (error) {
    console.error(`Error handling file event (${event}, ${filePath}):`, error);
  }
};


// Only one setup can run at a time otherwise the apple script
// might not work correctly or accept the wrong sharing link
const setupLimiter = new Bottleneck({
  maxConcurrent: 1, 
});

/**
 * Wait for a new top-level directory to appear, rename it, and notify the remote server.
 * @param {string} blogID - The blogID to associate with the folder
 * @param {string} sharingLink - The iCloud sharing link for the folder
 */
const setupBlog = setupLimiter.wrap(async (blogID, sharingLink) => {
  console.log(`Waiting for a new folder to set up blogID: ${blogID} using sharingLink: ${sharingLink}`);

  const checkInterval = 100; // Interval (in ms) to check for new directories
  const timeout = 1000 * 15; // Timeout (in ms) to wait for a new directory: 15 seconds
  const start = Date.now();
  try {
    // Get the initial state of the top-level directories
    const initialDirs = await fs.readdir(iCloudDriveDirectory, { withFileTypes: true });
    const initialDirNames = initialDirs.filter((dir) => dir.isDirectory()).map((dir) => dir.name);

    console.log(`Initial state of iCloud Drive: ${initialDirNames.join(", ") || "No directories"}`);

    // run the acceptSharingLink script in the background
    console.log('running the acceptSharingLink script');
    acceptSharingLink(sharingLink);

    while (true && Date.now() - start < timeout) {
        // Get the current state of the top-level directories
        const currentDirs = await fs.readdir(iCloudDriveDirectory, { withFileTypes: true });
        const currentDirNames = currentDirs.filter((dir) => dir.isDirectory()).map((dir) => dir.name);

        // Find any new directories by comparing initial state with the current state
        const newDirs = currentDirNames.filter((dirName) => !initialDirNames.includes(dirName));

        if (newDirs.length > 0) {
          const newDirName = newDirs[0]; // Handle the first new directory found
          console.log(`Found new folder: ${newDirName}`);

          const oldPath = path.join(iCloudDriveDirectory, newDirName);
          const newPath = path.join(iCloudDriveDirectory, blogID);

          // Rename the folder
          await fs.rename(oldPath, newPath);

          console.log(`Renamed folder from ${newDirName} to ${blogID}`);

          // Notify the remote server that setup is complete
          const res = await fetch(`${remoteServer}/setup-complete`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization, // Use the Authorization header
              blogID,
            }
          });

          if (!res.ok) {
            console.error(`Failed to send setup-complete notification for blogID: ${blogID}`);
          } else {
            console.log(`Setup-complete notification sent for blogID: ${blogID}`);
          }

          return; // Setup is complete, exit the loop
        }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    console.error(`Timed out waiting for a new folder to set up blogID: ${blogID}`);

  } catch (error) {
    console.error(`Failed to initialize setup for blogID (${blogID}):`, error);
  }
});

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

/**
 * Start the local express server.
 */
const startServer = () => {
  const app = express();

  app.use(express.json());

  app.get("/ping", async (req, res) => {
    res.send("pong");
  });

  app.use((req, res, next)=>{
    const authorization = req.header("Authorization"); // New header for the Authorization secret

    if (authorization !== Authorization) {
      return res.status(403).send("Unauthorized");
    }
    
    next();
  });

  app.post("/disconnect", async (req, res) => {
    const blogID = req.header("blogID");

    if (!blogID) {
      return res.status(400).send("Missing blogID header");
    }

    // ensure the blogID doesn't container any characters other than
    // letters, numbers and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(blogID)) {
      return res.status(400).send("Invalid blogID");
    }

    console.log(`Received disconnect request for blogID: ${blogID}`);

    // remove the blogid folder and the limiter
    limiters.delete(blogID);
    await fs.remove(path.join(iCloudDriveDirectory, blogID));

    console.log(`Disconnected blogID: ${blogID}`);

    res.sendStatus(200);
  });

  app.get('/stats', async (req, res) => {
    
    const result = {};

    // use brctl quota to get the iCloud Drive quota and usage
    // e.g. '1899909948243 bytes of quota remaining in personal account'
    const { stdout: quota, stderr: quotaErr } = await exec('brctl quota');
    if (quotaErr) {
      console.error(`Error getting iCloud Drive quota: ${quotaErr}`);
      return res.status(500).send(quotaErr);
    }

    result.icloud_bytes_available = quota.match(/(\d+) bytes of quota remaining/)[1];

    // get root disk free space on the mac as a whole in bytes
    const { stdout: diskFree, stderr: diskFreeErr } = await exec('df /');
    if (diskFreeErr) {
      console.error(`Error getting disk free space: ${diskFreeErr}`);
      return res.status(500).send(diskFreeErr);
    }

    result.disk_bytes_available = diskFree.split('\n')[1].split(/\s+/)[3];

    res.json(result);
  });

  app.post("/setup", async (req, res) => {
    const blogID = req.header("blogID");
    
    const sharingLink = req.header("sharingLink"); // New header for the sharing link
  
    if (!blogID) {
      return res.status(400).send("Missing blogID header");
    }
  
    if (!sharingLink) {
      return res.status(400).send("Missing sharingLink header");
    }
  
    console.log(`Received setup request for blogID: ${blogID}, sharingLink: ${sharingLink}`);
    
    res.sendStatus(200);

    setupBlog(blogID, sharingLink) // Pass both blogID and sharingLink
      .then(() => console.log(`Setup complete for blogID: ${blogID}`))
      .catch((error) => {
        console.error(`Setup failed for blogID (${blogID}):`, error);
      });
  });

  app.listen(3000, () => {
    console.log("Macserver is running on port 3000");
  });
};

// Main entry point
(async () => {
  try {
    console.log("Starting macserver...");

    // Test connectivity with the remote server
    await ping();

    // Initialize the file watcher
    initializeWatcher();

    // Start the local server
    startServer();
  } catch (error) {
    console.error("Error starting macserver:", error);
    process.exit(1);
  }
})();