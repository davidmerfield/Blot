const execCommand = require("./execCommand");

module.exports = async function getGitCommit(arg) {
  let commitHash;

  if (!arg) {
    commitHash = await execCommand("git rev-parse master");
  } else if (/^[0-9a-fA-F]{40}$/.test(arg)) {
    commitHash = arg;
  } else if (/^[0-9a-fA-F]+$/.test(arg)) {
    commitHash = await execCommand(`git rev-parse "${arg}"`);
  } else {
    throw new Error("Invalid commit hash provided.");
  }

  const commitMessage = await execCommand(
    `git log -1 --pretty=%B ${commitHash}`
  );

  if (!commitMessage) {
    throw new Error("Failed to get commit message.");
  }

  if (!commitHash) {
    throw new Error("Failed to get commit hash.");
  }

  return {
    commitHash: commitHash.trim(),
    commitMessage: commitMessage.trim(),
  };
};
