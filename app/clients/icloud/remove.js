const localPath = require("helper/localPath");
const fs = require("fs-extra");
const remoteDelete = require("./sync/util/remoteDelete");

module.exports = async (blogID, path, callback) => {

    const pathOnBlot = localPath(blogID, path);

    await fs.remove(pathOnBlot);
    await remoteDelete(blogID, path);

    callback();
};


