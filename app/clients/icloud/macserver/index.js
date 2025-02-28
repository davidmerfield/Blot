require("dotenv").config();

const express = require("express");
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




/**
 * Handle file events from chokidar and interact with remote server.
 * @param {string} event - The file event (add, change, unlink, etc.)
 * @param {string} filePath - The full path of the file triggering the event
 */
const handleFileEvent = async (event, filePath) => {
  try {
    const relativePath = filePath.replace(`${iCloudDriveDirectory}/`, "");
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

    if (event === "add" || event === "change") {

      let body;
      for (let i = 0; i < 5; i++) {
        try {
          console.log(`Reading file: ${filePath}`);
          body = await fs.readFile(filePath);
          break;
        } catch (error) {
          console.error(`Failed to read file (${filePath}):`, error);
          await new Promise((resolve) => setTimeout(resolve, 100 * i)); // Exponential backoff
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
    } else if (event === "unlink") {
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
  } catch (error) {
    console.error(`Error handling file event (${event}, ${filePath}):`, error);
  }
};


/**
 * Wait for a new top-level directory to appear, rename it, and notify the remote server.
 * @param {string} blogID - The blogID to associate with the folder
 * @param {string} sharingLink - The iCloud sharing link for the folder
 */
const setupBlog = async (blogID, sharingLink) => {
  console.log(`Waiting for a new folder to set up blogID: ${blogID} using sharingLink: ${sharingLink}`);

  const checkInterval = 2000; // Interval (in ms) to check for new directories

  try {
    // Get the initial state of the top-level directories
    const initialDirs = await fs.readdir(iCloudDriveDirectory, { withFileTypes: true });
    const initialDirNames = initialDirs.filter((dir) => dir.isDirectory()).map((dir) => dir.name);

    console.log(`Initial state of iCloud Drive: ${initialDirNames.join(", ") || "No directories"}`);

    // run the acceptSharingLink script in the background
    console.log('running the acceptSharingLink script');
    acceptSharingLink(sharingLink);

    while (true) {
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
  } catch (error) {
    console.error(`Failed to initialize setup for blogID (${blogID}):`, error);
  }
};
/**
 * Initialize chokidar to watch the iCloud Drive directory.
 */
const initializeWatcher = () => {
  console.log(`Watching iCloud Drive directory: ${iCloudDriveDirectory}`);

  chokidar
    .watch(iCloudDriveDirectory, { ignoreInitial: true })
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