const fs = require("fs-extra");
const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const { iCloudDriveDirectory } = require("../config");

const POLL_INTERVAL = 10 * 1000; // Check every 10 seconds
const NUMBER_OF_LARGEST_FILES_TO_TRACK = 100;
const MAX_DISK_USAGE_BYTES = 10 * 1024 * 1024; // 10 MB

// Map to track the largest files for each blog folder
const largestFilesMap = new Map();

const getDiskUsage = async () => {
  const { stdout, stderr } = await exec(`du -sk "${iCloudDriveDirectory}"`);
  if (stderr) {
    throw new Error(`Error getting disk usage: ${stderr}`);
  }
  return parseInt(stdout.split("\t")[0]) * 1024;
};

const removeBlog = (blogID) => {
  if (!largestFilesMap.has(blogID)) return;
  largestFilesMap.delete(blogID);
};

// Updates the map of largest files for a given blogID
const addFile = async (blogID, filePath) => {
  const stat = await fs.stat(filePath);
  const size = stat.size;
  if (!largestFilesMap.has(blogID)) {
    largestFilesMap.set(blogID, []);
  }

  const files = largestFilesMap.get(blogID);

  // Check if the file already exists in the map
  const fileIndex = files.findIndex((file) => file.filePath === filePath);
  if (fileIndex !== -1) {
    files[fileIndex].size = size; // Update the size if the file already exists
  } else {
    files.push({ filePath, size });
  }

  // Sort by size (largest first)
  files.sort((a, b) => b.size - a.size);

  // Keep only the top N largest files (optional, adjust N as needed)
  if (files.length > NUMBER_OF_LARGEST_FILES_TO_TRACK) {
    files.length = NUMBER_OF_LARGEST_FILES_TO_TRACK;
  }

  largestFilesMap.set(blogID, files);
};

// Removes a file from the largest files map
const removeFile = (blogID, filePath) => {
  if (!largestFilesMap.has(blogID)) return;
  const files = largestFilesMap
    .get(blogID)
    .filter((file) => file.filePath !== filePath);
  largestFilesMap.set(blogID, files);
};

const check = async (evictFiles) => {
  console.log(`Checking free disk space...`);

  let diskUsage = await getDiskUsage();

  if (diskUsage < MAX_DISK_USAGE_BYTES) {
    console.log(
      `Disk usage is below threshold: ${diskUsage} bytes of ${MAX_DISK_USAGE_BYTES} bytes`
    );
    return;
  }

  let bytesToEvict = diskUsage - MAX_DISK_USAGE_BYTES;

  for (const [blogID, files] of largestFilesMap) {
    const filesToEvict = [];
    let bytesToBeEvicted = 0;

    for (const { filePath } of files) {
      let stat;

      try {
        stat = await fs.stat(filePath);
      } catch (fileError) {
        console.error(`Error getting file stat: ${fileError}`);
        continue;
      }

      // Skip already evicted files
      if (stat.blocks === 0) {
        console.log(`Skipping evicted file: ${filePath}`);
        continue;
      }

      filesToEvict.push(filePath);
      bytesToBeEvicted += stat.size;

      if (bytesToBeEvicted >= bytesToEvict) {
        console.log(`Stopping at ${filesToEvict.length} files`);
        break;
      }
    }

    if (filesToEvict.length === 0) {
      console.log(`No files to evict for blogID: ${blogID}`);
      continue;
    }

    console.log(`Evicting ${filesToEvict.length} files for blogID: ${blogID}`);
    await evictFiles(blogID, filesToEvict);
    diskUsage = await getDiskUsage();
    bytesToEvict = diskUsage - MAX_DISK_USAGE_BYTES;

    if (diskUsage < MAX_DISK_USAGE_BYTES) {
      console.log(
        `Disk usage is now below threshold: ${diskUsage} bytes of ${MAX_DISK_USAGE_BYTES} bytes`
      );
      return;
    }
  }

  console.warn(`Disk usage is still above threshold: ${diskUsage} bytes`);
};

const checkDiskSpace = (evictFiles) => {
  console.log(`Starting disk space monitoring...`);
  setInterval(() => {
    check(evictFiles);
  }, POLL_INTERVAL);
};

module.exports = {
  checkDiskSpace,
  addFile,
  removeFile,
  removeBlog,
};
