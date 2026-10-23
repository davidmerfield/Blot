import exec from "../exec.js";
import { join } from "path";
import fs from "fs-extra";
import Bottleneck from "bottleneck";
import status from "../httpClient/status.js";
import { iCloudDriveDirectory } from "../config.js";
import clfdate from "../util/clfdate.js";

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
  console.log(clfdate(), 
    `Waiting for a new folder to set up blogID: ${blogID} using sharingLink: ${sharingLink}`
  );

  const checkInterval = 100; // Interval (in ms) to check for new directories
  const timeout = 1000 * 30; // Timeout (in ms) to wait for a new directory: 30 seconds

  // Start from a clean slate: no leftover Finder windows or sheets from an
  // earlier run, and no unclaimed folders that would hide the new one
  await resetFinder();
  await removeStaleFolders();

  // Get the initial state of the top-level directories
  const initialDirs = await fs.readdir(iCloudDriveDirectory, {
    withFileTypes: true,
  });
  const initialDirNames = initialDirs
    .filter((dir) => dir.isDirectory())
    .map((dir) => dir.name);

  console.log(clfdate(), 
    `Initial state of iCloud Drive: ${
      initialDirNames.join(", ") || "No directories"
    }`
  );

  console.log(clfdate(), "running the acceptSharingLink script");
  const outcome = await acceptSharingLink(sharingLink);

  if (outcome === "NO_ACCESS") {
    throw new Error(
      "The iCloud account does not have access to this folder. Check the sharing link allows anyone with the link to access it"
    );
  }

  if (outcome === "INVALID_LINK") throw new Error("Invalid sharing link");

  if (outcome === "OTHER_USER") {
    throw new Error("This sharing link was made for another iCloud user");
  }

  // Time the wait from here so the reset and the AppleScript don't eat into it
  const start = Date.now();

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
      console.log(clfdate(), `Found new folder: ${newDirName}`);

      const oldPath = join(iCloudDriveDirectory, newDirName);
      const newPath = join(iCloudDriveDirectory, blogID);

      // If there is already a folder with the blogID, delete it
      await fs.remove(newPath);

      // Rename the folder
      await fs.rename(oldPath, newPath);
      console.log(clfdate(), `Renamed folder from ${newDirName} to ${blogID}`);
      return; // Setup is complete, exit the loop
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.error(clfdate(), 
    `Timed out waiting for a new folder to set up blogID: ${blogID} after ${timeout}ms`
  );
  throw new Error("Invalid sharing link");
});
const escapeAppleScriptString = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r\n|\r|\n/g, "\\n");

// Finder windows and sheets left over from an earlier run (e.g. an "Ask for
// Access" sheet) block the next sharing link, so each run starts by closing
// them and each run ends by closing them again
const resetScript = `
try
    tell application "System Events"
        if exists process "Finder" then
            tell process "Finder"
                repeat with w in windows
                    try
                        click button "Cancel" of sheet 1 of w
                    end try
                end repeat
            end tell
        end if
    end tell
end try
try
    tell application "Finder" to close every window
end try
tell application "System Events"
    if exists process "Finder" then
        return (count of windows of process "Finder") as text
    end if
end tell
return "0"
`;

async function resetFinder() {
  try {
    const { stdout } = await exec("osascript", ["-e", resetScript], {
      timeout: 15000,
    });
    if (stdout.trim() === "0") return;
  } catch (error) {
    console.error(clfdate(), "Finder reset script failed", error);
  }

  // Something is still open (or the script could not run): relaunch Finder
  console.log(clfdate(), "Finder windows remain after reset, relaunching Finder");
  try {
    await exec("killall", ["Finder"], { timeout: 5000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(clfdate(), "Failed to relaunch Finder", error);
  }
}

// A top-level folder that is not a blog_ folder is a shared folder that was
// accepted but never renamed (a failed or timed out setup). Left in place it
// stops a new share with the same name from looking like a new folder
async function removeStaleFolders() {
  const entries = await fs.readdir(iCloudDriveDirectory, {
    withFileTypes: true,
  });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".") || entry.name.startsWith("blog_")) continue;

    const path = join(iCloudDriveDirectory, entry.name);
    const contents = await fs.readdir(path);

    if (contents.length) {
      console.error(
        clfdate(),
        `Leaving unclaimed non-empty folder in iCloud Drive: ${entry.name}`
      );
      continue;
    }

    console.log(clfdate(), `Removing empty unclaimed folder: ${entry.name}`);
    await fs.rmdir(path);
  }
}

// Used the accessibility inspector to find the UI elements to interact with.
// Prints one of: OPENED, NO_ACCESS, INVALID_LINK, OTHER_USER, TIMEOUT
const appleScript = (sharingLink) => `
set outcome to "TIMEOUT"
try
    tell application "Finder"
        open location "${sharingLink}"
    end tell

    set timeoutSeconds to 10
    set startTime to (current date)

    tell application "System Events"
        repeat
            -- Dialogs from the iCloud sharing system
            if exists process "UserNotificationCenter" then
                tell process "UserNotificationCenter"
                    if exists window 1 then
                        -- "Continue" means the link was made for another user
                        if exists (button "Continue" of window 1) then
                            click button "Cancel" of window 1
                            set outcome to "OTHER_USER"
                        -- "OK" means the sharing link is invalid
                        else if exists (button "OK" of window 1) then
                            click button "OK" of window 1
                            set outcome to "INVALID_LINK"
                        -- "Open" means the sharing link is valid
                        else if exists (button "Open" of window 1) then
                            click button "Open" of window 1
                            set outcome to "OPENED"
                        end if
                    end if
                end tell
            end if

            -- Finder's "Ask for Access" sheet: the account is not allowed in
            if outcome is "TIMEOUT" and (exists process "Finder") then
                tell process "Finder"
                    repeat with w in windows
                        try
                            if exists (button "Send Request" of sheet 1 of w) then
                                click button "Cancel" of sheet 1 of w
                                set outcome to "NO_ACCESS"
                            end if
                        end try
                        try
                            if exists (button "Send Request" of w) then
                                click button "Cancel" of w
                                set outcome to "NO_ACCESS"
                            end if
                        end try
                    end repeat
                end tell
            end if

            if outcome is not "TIMEOUT" then exit repeat
            if ((current date) - startTime) > timeoutSeconds then exit repeat
            delay 0.1
        end repeat
    end tell

    -- wait 2 seconds for the Finder to process the new folder if it was created
    delay 2
on error errorMessage
    set outcome to "ERROR " & errorMessage
end try

-- Always close the Finder windows, even after an error
try
    tell application "Finder"
        close every window
    end tell
end try

return outcome
`;

async function acceptSharingLink(sharingLink) {
  console.log(clfdate(), `Running AppleScript to accept sharing link: ${sharingLink}`);
  const escapedSharingLink = escapeAppleScriptString(sharingLink);

  let stdout;
  let stderr;
  try {
    ({ stdout, stderr } = await exec(
      "osascript",
      ["-e", appleScript(escapedSharingLink)],
      { timeout: 25000 }
    ));
  } catch (error) {
    console.error(
      clfdate(),
      `AppleScript execution failed for sharing link: ${sharingLink}`,
      error
    );
    await resetFinder();
    throw error;
  }

  if (stderr && stderr.trim()) {
    throw new Error(`Unexpected AppleScript stderr: ${stderr}`);
  }

  const outcome = String(stdout || "").trim();
  console.log(clfdate(), `AppleScript finished: ${outcome}`);

  if (outcome.startsWith("ERROR")) {
    await resetFinder();
    throw new Error(`AppleScript failed: ${outcome}`);
  }

  // On OPENED or TIMEOUT we can't tell if it worked because the dialogs are
  // hard to observe from AppleScript. We check if it worked by determining if
  // the folder was created
  return outcome;
}

export default async (req, res) => {
  const blogID = req.header("blogID");

  const sharingLink = req.header("sharingLink"); // New header for the sharing link

  if (!blogID) {
    console.error(clfdate(), "Missing blogID header for setup request");
    return res.status(400).send("Missing blogID header");
  }

  if (!sharingLink) {
    console.error(clfdate(), "Missing sharingLink header for setup request", {
      blogID,
    });
    return res.status(400).send("Missing sharingLink header");
  }

  console.log(clfdate(),
    `Received setup request for blogID: ${blogID}, sharingLink: ${sharingLink}`
  );

  // Setting up a folder involves driving the Finder UI via AppleScript and then
  // waiting for iCloud to materialise the shared folder, which can take tens of
  // seconds. Rather than holding the HTTP connection open for the whole
  // operation, acknowledge the request immediately and report the outcome
  // asynchronously via the status client (POST /status on the remote server).
  const reportStatus = async (payload) => {
    try {
      await status(blogID, payload);
    } catch (error) {
      console.error(
        clfdate(),
        `Failed to report setup status for blogID (${blogID}):`,
        error
      );
    }
  };

  setupBlog(blogID, sharingLink)
    .then(() => {
      console.log(clfdate(), `Setup complete for blogID: ${blogID}`);
      return reportStatus({ acceptedSharingLink: true, error: null });
    })
    .catch((error) => {
      console.error(clfdate(), `Setup failed for blogID (${blogID}):`, error);
      return reportStatus({
        acceptedSharingLink: false,
        error: error.message,
        // Not a health issue: the dashboard shows it with retry/cancel
        errorCode: "SETUP_FAILED",
      });
    });

  return res.status(202).json({ accepted: true });
};
