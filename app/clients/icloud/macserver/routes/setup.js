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

// What the dashboard shows for each way accepting the sharing link can fail
const SETUP_ERRORS = {
  NO_ACCESS:
    "iCloud is asking for access to this folder. Share it with Blot's iCloud account, or allow anyone with the link to access it, then retry",
  PRIVATE:
    "This sharing link is private. Share the folder with Blot's iCloud account, or allow anyone with the link to access it, then retry",
  INVALID_LINK: "Invalid sharing link",
  TIMEOUT:
    "Timed out waiting for iCloud to share the folder. Check the sharing link is valid and retry",
};

// Look for the "Ask for Access" sheet every few seconds while waiting for the
// folder, so we can fail fast instead of waiting out the timeout
const askForAccessInterval = 2000;

/**
 * Wait for a new top-level directory to appear, rename it, and notify the remote server.
 * Always leaves Finder tidy: after a failure the next setup would otherwise
 * run behind whatever window or dialog this one left open.
 * @param {string} blogID - The blogID to associate with the folder
 * @param {string} sharingLink - The iCloud sharing link for the folder
 */
const setupBlog = setupLimiter.wrap(async (blogID, sharingLink) => {
  try {
    await setupFolder(blogID, sharingLink);
  } catch (error) {
    await resetFinder();
    throw error;
  }
});

async function setupFolder(blogID, sharingLink) {
  console.log(clfdate(), 
    `Waiting for a new folder to set up blogID: ${blogID} using sharingLink: ${sharingLink}`
  );

  const checkInterval = 100; // Interval (in ms) to check for new directories
  const timeout = 1000 * 30; // Timeout (in ms) to wait for a new directory: 30 seconds

  // Start from a clean slate: no leftover Finder windows, Safari windows or
  // dialogs from an earlier run, and no unclaimed folders that would hide
  // the new one
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

  if (SETUP_ERRORS[outcome] && outcome !== "TIMEOUT") {
    throw new Error(SETUP_ERRORS[outcome]);
  }

  // Time the wait from here so the reset and the AppleScript don't eat into it
  const start = Date.now();
  let lastAskForAccessCheck = start;

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

    if (Date.now() - lastAskForAccessCheck > askForAccessInterval) {
      lastAskForAccessCheck = Date.now();
      if (await dismissAskForAccess()) {
        console.error(clfdate(), "Finder showed the Ask for Access sheet");
        throw new Error(SETUP_ERRORS.NO_ACCESS);
      }
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.error(clfdate(), 
    `Timed out waiting for a new folder to set up blogID: ${blogID} after ${timeout}ms`
  );

  // One last look, and record what was on screen so the cause can be found
  if (await dismissAskForAccess()) throw new Error(SETUP_ERRORS.NO_ACCESS);
  console.error(clfdate(), `Screen at timeout:\n${await describeScreen()}`);
  throw new Error(SETUP_ERRORS.TIMEOUT);
}

const escapeAppleScriptString = (value) =>
  String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r\n|\r|\n/g, "\\n");

// Handler shared by the scripts below: if Finder (or a system dialog) is
// showing the "Ask for Access" sheet, cancel it and say so. Returns true if
// it found one. Used while waiting for the folder and in the reset.
const askForAccessHandler = `
on dismissAskForAccess()
    tell application "System Events"
        repeat with processName in {"Finder", "UserNotificationCenter", "CoreServicesUIAgent"}
            if exists process (processName as text) then
                tell process (processName as text)
                    repeat with w in windows
                        try
                            if exists (button "Send Request" of sheet 1 of w) then
                                click button "Cancel" of sheet 1 of w
                                return true
                            end if
                        end try
                        try
                            if exists (button "Send Request" of w) then
                                click button "Cancel" of w
                                return true
                            end if
                        end try
                    end repeat
                end tell
            end if
        end repeat
    end tell
    return false
end dismissAskForAccess
`;

// Anything left over from an earlier run blocks the next sharing link, so
// each run starts by closing it all: system dialogs (Cancel / OK), the "Ask
// for Access" sheet, System Settings (opened by the "Continue" button) and
// every Finder window. Prints how many Finder windows are left.
const resetScript = `
${askForAccessHandler}
try
    dismissAskForAccess()
end try
try
    tell application "System Events"
        if exists process "UserNotificationCenter" then
            tell process "UserNotificationCenter"
                repeat with w in windows
                    try
                        click button "Cancel" of w
                    on error
                        try
                            click button "OK" of w
                        end try
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

// Lists every window and its buttons for the log when setup times out
const describeScreenScript = `
tell application "System Events"
    set out to ""
    repeat with p in (every process)
        try
            repeat with w in windows of p
                set out to out & (name of p) & " | " & (name of w)
                try
                    set out to out & " | buttons: " & ((name of buttons of w) as text)
                end try
                try
                    set out to out & " | sheet buttons: " & ((name of buttons of sheet 1 of w) as text)
                end try
                try
                    set out to out & " | text: " & ((value of static texts of w) as text)
                end try
                set out to out & linefeed
            end repeat
        end try
    end repeat
    return out
end tell
`;

async function describeScreen() {
  try {
    const { stdout } = await exec("osascript", ["-e", describeScreenScript], {
      timeout: 15000,
    });
    return stdout.trim() || "(no windows)";
  } catch (error) {
    return `(could not describe the screen: ${error.message})`;
  }
}

async function dismissAskForAccess() {
  try {
    const { stdout } = await exec(
      "osascript",
      ["-e", `${askForAccessHandler}\nreturn dismissAskForAccess() as text`],
      { timeout: 10000 }
    );
    return stdout.trim() === "true";
  } catch (error) {
    console.error(clfdate(), "Ask for Access check failed", error);
    return false;
  }
}

async function resetFinder() {
  // Safari opens when a link is not handed to iCloud Drive and System
  // Settings opens from the "Continue" dialog; neither is wanted open
  for (const app of ["Safari", "System Settings"]) {
    try {
      await exec("killall", [app], { timeout: 5000 });
    } catch (error) {
      // killall exits non-zero when the app is not running
    }
  }

  try {
    const { stdout } = await exec("osascript", ["-e", resetScript], {
      timeout: 15000,
    });
    const windowsLeft = stdout.trim();
    if (windowsLeft !== "0") {
      console.error(
        clfdate(),
        `Finder windows remain after reset: ${windowsLeft}`
      );
    }
  } catch (error) {
    console.error(clfdate(), "Finder reset script failed", error);
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
// Prints one of: OPENED, NO_ACCESS, INVALID_LINK, PRIVATE, TIMEOUT
const appleScript = (sharingLink) => `
${askForAccessHandler}
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
                        -- "Continue" means the link is private ("... is private.
                        -- Please verify that you're allowed to open it")
                        if exists (button "Continue" of window 1) then
                            click button "Cancel" of window 1
                            set outcome to "PRIVATE"
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
            if outcome is "TIMEOUT" then
                if my dismissAskForAccess() then set outcome to "NO_ACCESS"
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
