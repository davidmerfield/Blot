const { promisify } = require("util");
const exec = promisify(require("child_process").exec);

const POLL_INTERVAL = 10 * 1000; // Check every 10 seconds

// Map to track the largest files for each blog folder
const largestFilesMap = new Map();

const getDiskUsage = async () => {
  const { stdout, stderr } = await exec(`du -sk "${iCloudDriveDirectory}"`);
  if (stderr) {
    throw new Error(`Error getting disk usage: ${stderr}`);
  }
  return parseInt(stdout.split("\t")[0]) * 1024;
};

const NUMBER_OF_LARGEST_FILES_TO_TRACK = 100;
const MAX_DISK_USAGE_BYTES = 10 * 1024 * 1024; // 10 MB

const removeBlog = (blogID) => {
  if (!largestFilesMap.has(blogID)) return;
  largestFilesMap.delete(blogID);
};

// Updates the map of largest files for a given blogID
const addFile = (blogID, filePath, size) => {
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

const check = async () => {
  console.log(`Checking free disk space...`);

  let diskUsage = await getDiskUsage();

  if (diskUsage < MAX_DISK_USAGE_BYTES) {
    console.log(
      `Disk usage is below threshold: ${diskUsage} bytes of ${MAX_DISK_USAGE_BYTES} bytes`
    );
    return;
  }

  for (const [blogID, files] of largestFilesMap) {
    try {
      // Unwatch the blogID to prevent file locks during eviction
      await unwatch(blogID);

      for (const { filePath } of files) {
        try {
          const stats = await fs.stat(filePath);

          // Skip already evicted files
          if (stats.blocks === 0) {
            console.log(`Skipping evicted file: ${filePath}`);
            continue;
          }

          console.log(`Evicting file: ${filePath}`);
          await brctl.evict(filePath); // Evict the file
        } catch (fileError) {
          console.error(`Error evicting file: ${filePath}`, fileError);
        }
      }
    } catch (blogError) {
      console.error(`Error processing blogID: ${blogID}`, blogError);
    } finally {
      // Re-watch the blog folder after eviction
      await watch(blogID);

      diskUsage = await getDiskUsage();
      console.log(`Disk usage after eviction: ${disk} bytes`);

      if (diskUsage < MAX_DISK_USAGE_BYTES) {
        console.log(
          `Disk usage is below threshold after eviction: ${diskUsage} bytes of ${MAX_DISK_USAGE_BYTES} bytes`
        );
        return;
      }
    }
  }

  console.warn(`Disk usage is still above threshold: ${diskUsage} bytes`);
};

const checkDiskSpace = () => {
  setInterval(check, POLL_INTERVAL);
};

module.exports = {
  checkDiskSpace,
  addFile,
  removeFile,
  removeBlog,
};
