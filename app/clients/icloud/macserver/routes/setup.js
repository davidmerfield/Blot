const exec = require("util").promisify(require("child_process").exec);
const { join } = require("path");
const fs = require("fs-extra");
const Bottleneck = require("bottleneck");
const setupComplete = require("../httpClient/setupComplete");
const { iCloudDriveDirectory } = require("../config");

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
  console.log(
    `Waiting for a new folder to set up blogID: ${blogID} using sharingLink: ${sharingLink}`
  );

  const checkInterval = 100; // Interval (in ms) to check for new directories
  const timeout = 1000 * 15; // Timeout (in ms) to wait for a new directory: 15 seconds
  const start = Date.now();
  try {
    // Get the initial state of the top-level directories
    const initialDirs = await fs.readdir(iCloudDriveDirectory, {
      withFileTypes: true,
    });
    const initialDirNames = initialDirs
      .filter((dir) => dir.isDirectory())
      .map((dir) => dir.name);

    console.log(
      `Initial state of iCloud Drive: ${
        initialDirNames.join(", ") || "No directories"
      }`
    );

    // run the acceptSharingLink script in the background
    console.log("running the acceptSharingLink script");
    acceptSharingLink(sharingLink);

    while (true && Date.now() - start < timeout) {
      // Get the current state of the top-level directories
      const currentDirs = await fs.readdir(iCloudDriveDirectory, {
        withFileTypes: true,
      });
      const currentDirNames = currentDirs
        .filter((dir) => dir.isDirectory())
        .map((dir) => dir.name);

      // Find any new directories by comparing initial state with the current state
      const newDirs = currentDirNames.filter(
        (dirName) => !initialDirNames.includes(dirName)
      );

      if (newDirs.length > 0) {
        const newDirName = newDirs[0]; // Handle the first new directory found
        console.log(`Found new folder: ${newDirName}`);

        const oldPath = join(iCloudDriveDirectory, newDirName);
        const newPath = join(iCloudDriveDirectory, blogID);

        // Rename the folder
        await fs.rename(oldPath, newPath);

        console.log(`Renamed folder from ${newDirName} to ${blogID}`);
        await setupComplete(blogID);
        

        return; // Setup is complete, exit the loop
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, checkInterval));
    }

    console.error(
      `Timed out waiting for a new folder to set up blogID: ${blogID}`
    );
  } catch (error) {
    console.error(`Failed to initialize setup for blogID (${blogID}):`, error);
  }
});


// Used the accessiblity inspector to find the UI elements to interact with
const appleScript = (sharingLink) => `
-- Open the specified sharing link in Finder
try
    -- Open the sharing link in Finder
    tell application "Finder"
        open location "${sharingLink}"
    end tell

    -- Wait for the iCloud sharing system dialog to appear
    tell application "System Events"
        tell process "UserNotificationCenter"
            -- Wait until the "Open" button in the system dialog is detected
            repeat until exists (button "Open" of window 1)
                delay 0.1 -- Check every 0.1 seconds for the "Open" button
            end repeat

            -- Click the "Open" button in the system dialog
            click button "Open" of window 1
        end tell
    end tell

    -- Close all Finder windows after interacting with the sharing dialog
    tell application "Finder"
        close every window
    end tell
on error errMsg
    -- Handle any errors that occur during the process
    display dialog "An error occurred: " & errMsg
end try
`;

// Function to run inline AppleScript
function acceptSharingLink(sharingLink) {
  return new Promise((resolve, reject) => {
    console.log(`Running AppleScript to accept sharing link: ${sharingLink}`);
    exec(`osascript -e '${appleScript(sharingLink)}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing AppleScript: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.error(`AppleScript stderr: ${stderr}`);
        return reject(new Error(stderr));
      }
      console.log(`AppleScript stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

module.exports = async (req, res) => {
  const blogID = req.header("blogID");

  const sharingLink = req.header("sharingLink"); // New header for the sharing link

  if (!blogID) {
    return res.status(400).send("Missing blogID header");
  }

  if (!sharingLink) {
    return res.status(400).send("Missing sharingLink header");
  }

  console.log(
    `Received setup request for blogID: ${blogID}, sharingLink: ${sharingLink}`
  );

  res.sendStatus(200);

  setupBlog(blogID, sharingLink) // Pass both blogID and sharingLink
    .then(() => console.log(`Setup complete for blogID: ${blogID}`))
    .catch((error) => {
      console.error(`Setup failed for blogID (${blogID}):`, error);
    });
};
