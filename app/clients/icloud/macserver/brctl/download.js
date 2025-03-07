const { iCloudDriveDirectory } = require("../config");
const fs = require("fs-extra");
const exec = require("util").promisify(require("child_process").exec);
const TIMEOUT = 1 * 60 * 1000; // 1 minute

module.exports = async (path) => {
  const initialStat = await fs.stat(path);
  const start = Date.now();

  if (!path.startsWith(iCloudDriveDirectory)) {
    throw new Error(`File not in iCloud Drive: ${path}`);
  }

  const isDownloaded =
    initialStat.blocks === initialStat.size / initialStat.blksize;

  if (isDownloaded) {
    console.log(`File already downloaded: ${path}`);
    return;
  }

  const pathInDrive = path.replace(iCloudDriveDirectory, "").slice(1);

  console.log(`Downloading file: ${pathInDrive}`);

  const { stdout, stderr } = await exec(`brctl download "${pathInDrive}"`, {
    cwd: iCloudDriveDirectory,
  });

  if (stdout !== "") {
    throw new Error(`Unexpected stdout: ${stdout}`);
  }

  if (stderr !== "") {
    throw new Error(`Unexpected stderr: ${stderr}`);
  }

  while (true && Date.now() - start < TIMEOUT) {
    const stat = await fs.stat(path);
    if (stat.blocks === stat.size / stat.blksize) {
      console.log(`Download complete: ${path}`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timeout downloading file: ${path}`);
};
