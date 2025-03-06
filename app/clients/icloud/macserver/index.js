const express = require("express");
const { raw } = express;
const { Authorization, maxiCloudFileSize, remoteServer } = require("./config");
const { initializeWatcher } = require("./watcher");

const startServer = async () => {
  const app = express();

  app.use((req, res, next) => {
    console.log(`Request: ${req.method} ${req.url}`);

    const authorization = req.header("Authorization"); // New header for the Authorization secret

    if (authorization !== Authorization) {
      return res.status(403).send("Unauthorized");
    }

    next();
  });

  app.use(express.json());

  app.use(raw({ type: "application/octet-stream", limit: maxiCloudFileSize }));

  app.get("/ping", async (req, res) => {
    res.send("pong");
  });

  app.post("/upload", require("./routes/upload"));

  app.post("/delete", require("./routes/delete"));

  app.post("/mkdir", require("./routes/mkdir"));

  app.post("/disconnect", require("./routes/disconnect"));

  app.get("/readdir", require("./routes/readdir"));

  app.get("/download", require("./routes/download"));

  app.get("/stats", require("./routes/stats"));

  app.post("/setup", require("./routes/setup"));

  app.listen(3000, () => {
    console.log("Macserver is running on port 3000");
  });
};

// Main entry point
(async () => {
  try {

    // Test connectivity with the remote server
    console.log("Pinging remote server...");
    const res = await fetch(remoteServer + "/ping", {
      headers: {
        Authorization, // Use the Authorization header
      },
    });

    if (!res.ok) {
      throw new Error(`Ping failed: ${res.statusText}`);
    }

    const text = await res.text();
    console.log(`Ping response: ${text}`);

    // Start the local server
    console.log("Starting macserver...");
    await startServer();

    // Initialize the file watcher
    console.log("Initializing file watcher...");
    await initializeWatcher();

    console.log("Macserver started successfully");
  } catch (error) {
    console.error("Error starting macserver:", error);
    process.exit(1);
  }
})();
