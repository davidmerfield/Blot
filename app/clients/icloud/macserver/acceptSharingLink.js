const { exec } = require("child_process");

// I used the accessiblity inspector to find the UI elements to interact with
// and then wrote this AppleScript to automate the process
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
function runInlineAppleScript(sharingLink) {
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

if (require.main === module) {
  // Run the inline AppleScript and handle the result
  if (!process.argv[2]) {
    console.error("Please provide a sharing link as an argument");
    process.exit(1);
  }

  runInlineAppleScript(process.argv[2])
    .then((output) => {
      console.log("AppleScript executed successfully:", output);
    })
    .catch((error) => {
      console.error("Failed to execute AppleScript:", error);
    });
}

module.exports = runInlineAppleScript;
