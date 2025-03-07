const { iCloudDriveDirectory } = require("../config");
const fs = require("fs-extra");
const exec = require("util").promisify(require("child_process").exec);
const TIMEOUT = 20 * 1000; // 20 seconds

module.exports = async (path) => {
  console.log(`Downloading file: ${path}`);

  const initialStat = await fs.stat(path);
  const start = Date.now();

  if (!path.startsWith(iCloudDriveDirectory)) {
    throw new Error(`File not in iCloud Drive: ${path}`);
  }

  console.log("initialStat", initialStat);

  // Determine if the file is already downloaded
  const expectedBlocks = Math.max(Math.ceil(initialStat.size / 512), 8);
  const isDownloaded = initialStat.blocks === expectedBlocks;

  console.log(`Expected blocks: ${expectedBlocks}`);
  console.log(`Current blocks: ${initialStat.blocks}`);
  console.log(`Is downloaded: ${isDownloaded}`);

  if (isDownloaded) {
    console.log(`File already downloaded: ${path}`);
    return;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "").slice(1);

  console.log(`Path in drive: ${pathInDrive}`);

  const { stdout, stderr } = await exec(`brctl download "${pathInDrive}"`, {
    cwd: iCloudDriveDirectory,
  });

  if (stdout !== "") {
    throw new Error(`Unexpected stdout: ${stdout}`);
  }

  if (stderr !== "") {
    throw new Error(`Unexpected stderr: ${stderr}`);
  }

  while (Date.now() - start < TIMEOUT) {
    console.log(`Checking download status: ${path}`);
    const stat = await fs.stat(path);

    if (stat.blocks === expectedBlocks) {
      console.log(`Download complete: ${path}`);
      return;
    } else {
      console.log(`Blocks: ${stat.blocks} / ${expectedBlocks}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timeout downloading file: ${path}`);
};
