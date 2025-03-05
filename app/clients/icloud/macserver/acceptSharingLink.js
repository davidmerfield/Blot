const { exec } = require("child_process");

// Optimized AppleScript code with Finder window closure
const appleScript = (sharingLink) => `
-- Open the specified sharing link in Finder
try
    tell application "Finder"
        open location "${sharingLink}"
    end tell

    -- Wait for a system popup (dialog) to appear
    tell application "System Events"
        repeat until exists (first window whose role description is "dialog")
            delay 0.1 -- Check every 0.1 seconds for the popup
        end repeat

        -- Once the dialog appears, click the default button (e.g., "Accept" or "OK")
        tell (first window whose role description is "dialog")
            click button 1 -- Clicks the first button in the dialog
        end tell
    end tell

    -- Close all Finder windows
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
