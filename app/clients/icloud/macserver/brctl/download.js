const { iCloudDriveDirectory } = require("../config");
const fs = require("fs-extra");
const exec = require("util").promisify(require("child_process").exec);
const TIMEOUT = 20 * 1000; // 20 seconds
const POLLING_INTERVAL = 200; // 200 ms

const BLOCK_SIZE = 512;

module.exports = async (path) => {
  console.log(`Downloading file: ${path}`);

  const stat = await fs.stat(path);
  const start = Date.now();

  if (!path.startsWith(iCloudDriveDirectory)) {
    throw new Error(`File not in iCloud Drive: ${path}`);
  }

  // Determine if the file is already downloaded
  const roundUpBy8 = (x) => Math.ceil(x / 8) * 8;
  // It's important that if stat.size is 0, we expect 0 blocks
  // after 1 byte, we expect at least 8 blocks
  const expectedBlocks = roundUpBy8(Math.ceil(stat.size / BLOCK_SIZE));
  const isDownloaded = stat.blocks === expectedBlocks;

  console.log(`Blocks: ${stat.blocks} / ${expectedBlocks}`);

  if (isDownloaded) {
    console.log(`File already downloaded: ${path}`);
    return stat;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "").slice(1);

  console.log(`Issuing brctl download for path: ${pathInDrive}`);

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
    // we re-calculate the expected blocks in case the file size has changed
    const expectedBlocks = roundUpBy8(Math.ceil(stat.size / BLOCK_SIZE));

    console.log(`Blocks: ${stat.blocks} / ${expectedBlocks}`);

    if (stat.blocks === expectedBlocks) {
      console.log(`Download complete: ${path}`);
      return stat;
    } else {
        await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  throw new Error(`Timeout downloading file: ${path}`);
};
