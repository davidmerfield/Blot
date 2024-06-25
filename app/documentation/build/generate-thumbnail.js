const config = require("config");
const sharp = require("sharp");
const hashFile = require("helper/hashFile");
const { join } = require("path");
const fs = require("fs-extra");

const TMP_DIRECTORY = config.tmp_directory;

module.exports = async function generateThumbnail(from, to) {
    if (from.includes(".mobile.")) return;

    const hash = await hashFile(from);
    const cachedFilePath = join(TMP_DIRECTORY, `documentation-thumbs/${hash}.jpg`);

    try {
        await fs.copy(cachedFilePath, to);
        return;
    } catch (e) {
        // do nothing
    }

    try {
        await sharp(from)
            .resize({ width: 130 })
            .toFile(to);

        await fs.copy(to, cachedFilePath);
    } catch (e) {
        
    }
}
