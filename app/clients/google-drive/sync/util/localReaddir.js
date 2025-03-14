const getmd5Checksum = require("clients/google-drive/util/md5Checksum");
const fs = require("fs-extra");
const { join } = require("path");

const localreaddir = async (dir) => {
    const contents = await fs.readdir(dir);
  
    return Promise.all(
      contents.map(async (name) => {
        const path = join(dir, name);
        const [md5Checksum, stat] = await Promise.all([
          getmd5Checksum(path),
          fs.stat(path),
        ]);
  
        // Convert the modification time to an ISO string
        const modifiedTime = stat.mtime.toISOString();
        const isDirectory = stat.isDirectory();

        return {
          name,
          isDirectory,
          md5Checksum: isDirectory ? undefined : md5Checksum,
          modifiedTime: isDirectory ? undefined : modifiedTime,
        };
      })
    );
  };

module.exports = localreaddir;