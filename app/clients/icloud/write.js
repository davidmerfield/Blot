const localPath = require("helper/localPath");
const fs = require("fs-extra");
const remoteUpload = require("./sync/util/remoteUpload");

module.exports = async (blogID, path, contents, callback) => {

    const pathOnBlot = localPath(blogID, path);

    await fs.outputFile(pathOnBlot, contents);
    await remoteUpload(blogID, path);

    callback();
};


