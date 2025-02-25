const remoteServer = process.env.REMOTE_SERVER;
const iCloudDriveDirectory = process.env.ICLOUD_DRIVE_DIRECTORY;

if (!remoteServer) {
    throw new Error("REMOTE_SERVER is not set");
}

if (!iCloudDriveDirectory) {
    throw new Error("ICLOUD_DRIVE_DIRECTORY is not set");
}

const chokidar = require("chokidar");

// ping the remote server

const ping = async () => {
    const res = await fetch(remoteServer + "/ping");
    return res.text();
};

