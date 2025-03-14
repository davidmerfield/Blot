const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

module.exports = async function sshCommand(command) {
  try {
    // console.log(`Running SSH command: ${command}`);
    const { stdout } = await execAsync(`ssh blot "${command}"`);
    // console.log(`SSH command output: ${stdout}`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`SSH command failed: ${command}\n${error.message}`);
  }
}