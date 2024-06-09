const config = require("config");
const TMP_DIRECTORY = config.tmp_directory;
const sharp = require("sharp");
const hashFile = require("helper/hashFile");
const { join } = require("path");
const fs = require("fs-extra");

module.exports = async function generateThumbnail (from, to) {

if (from.includes(".mobile.")) return;

  const hash = await hashFile(from);
  const cachedFilePath = join(TMP_DIRECTORY, `${hash}.jpg`);

  try {


    await fs.copy(cachedFilePath, to);
  } catch (e) {
    // do nothing
  }

  // generate a thumbnail and store it in both the destination directory and the temp directory
  // under the hash of the file name so we can cache it
  await sharp(from)
    .resize({ width: 130 })
    .toFile(to)
    .then(() => fs.copy(to, cachedFilePath));
}