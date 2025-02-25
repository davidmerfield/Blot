const express = require('express');
const chokidar = require('chokidar');

const remoteServer = process.env.REMOTE_SERVER;
const iCloudDriveDirectory = process.env.ICLOUD_DRIVE_DIRECTORY;

if (!remoteServer) {
    throw new Error("REMOTE_SERVER is not set");
}

if (!iCloudDriveDirectory) {
    throw new Error("ICLOUD_DRIVE_DIRECTORY is not set");
}

const ping = async () => {
    const res = await fetch(remoteServer + "/ping");
    return res.text();
};

const chokidar = require("chokidar");

chokidar.watch(iCloudDriveDirectory).on("all", async (event, path) => {
    // all of the subfolders of the iCloud Drive directory
    // are named in the format blog_id/...
    const blogID = path.split("/")[0];

    console.log('blogID=' + blogID, event, path);

    if (event === "add" || event === "change") {
        const res = await fetch(remoteServer + "/upload", {
            method: "POST",
            body: JSON.stringify({ blogID, path }),
            headers: { "Content-Type": "application/json" }
        });

        console.log(await res.text());
    } else if (event === "unlink") {
        const res = await fetch(remoteServer + "/delete", {
            method: "POST",
            body: JSON.stringify({ blogID, path }),
            headers: { "Content-Type": "application/json" }
        });

        console.log(await res.text());
    }
});

const app = express();

app.get("/ping", async (req, res) => {
    res.send("pong");
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
