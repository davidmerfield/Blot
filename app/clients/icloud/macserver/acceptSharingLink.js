const { exec } = require("child_process");

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
module.exports = function runInlineAppleScript(sharingLink) {
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
