const { execSync } = require("child_process");

module.exports = function execCommand(command) {
    try {
      return execSync(command).toString().trim();
    } catch (error) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }
  