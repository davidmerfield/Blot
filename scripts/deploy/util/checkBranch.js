const execCommand = require("./execCommand");

module.exports = async function checkBranch() {
  const currentBranch = execCommand("git rev-parse --abbrev-ref HEAD");
  if (currentBranch !== "master") {
    throw new Error("You must be on the master branch to deploy.");
  }
};
