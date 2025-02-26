const { exec } = require("child_process");

// AppleScript code as a string
const appleScript = (sharingLink) => `
tell application "Finder"
    open location "${sharingLink}"
end tell
delay 5
tell application "System Events"
    keystroke return
end tell
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
