const { iCloudDriveDirectory } = require("../config");
const fs = require("fs-extra");
const exec = require("util").promisify(require("child_process").exec);
const TIMEOUT = 10 * 1000; // 10 seconds
const POLLING_INTERVAL = 200; // 200 ms

module.exports = async (path) => {
  console.log(`Evicting: ${path}`);

  const stat = await fs.stat(path);
  const start = Date.now();

  if (!path.startsWith(iCloudDriveDirectory)) {
    throw new Error(`File not in iCloud Drive: ${path}`);
  }

  const expectedBlocks = 0;
  const isEvicted = stat.blocks === expectedBlocks;

  console.log(`Blocks: ${stat.blocks} / ${expectedBlocks}`);

  if (isEvicted) {
    console.log(`File already evicted: ${path}`);
    return stat;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "").slice(1);

  console.log(`Issuing brctl evict for path: ${pathInDrive}`);

  const { stdout, stderr } = await exec(`brctl evict "${pathInDrive}"`, {
    cwd: iCloudDriveDirectory,
  });

  if (stdout !== "evicted content of '" + pathInDrive + "'\n") {
    throw new Error(`Unexpected stdout: ${stdout}`);
  }

  if (stderr !== "") {
    throw new Error(`Unexpected stderr: ${stderr}`);
  }

  while (Date.now() - start < TIMEOUT) {
    console.log(`Checking evict status: ${path}`);
    const stat = await fs.stat(path);

    console.log(`Blocks: ${stat.blocks} / ${expectedBlocks}`);

    if (stat.blocks === expectedBlocks) {
      console.log(`Eviction complete: ${path}`);
      return stat;
    } else {
      await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  throw new Error(`Timeout downloading file: ${path}`);
};
