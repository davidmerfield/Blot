const express = require("express");
const fs = require("fs-extra"); // For filesystem operations
const config = require("config"); // For accessing configuration values

const maxiCloudFileSize = config.icloud.maxFileSize; // Maximum file size for iCloud uploads

// Helper functions
const localPath = require("helper/localPath");
const establishSyncLock = require("../util/establishSyncLock");
const database = require("../database");
const site = new express.Router();
const syncToiCloud = require("../sync/to_iCloud");

// Middleware to verify the Authorization header
function verifyAuthorization(req, res, next) {
  const secret = config.icloud.secret; // Get the secret from config
  const authHeader = req.header("Authorization");

  if (!authHeader || authHeader !== secret) {
    console.warn("Unauthorized access attempt.");
    return res.status(403).send("Forbidden: Invalid Authorization header");
  }

  next(); // Proceed to the next middleware or route handler
}

async function checkBlogUsesICloud(req, res, next) {
  const blogID = req.header("blogID");

  if (!blogID) {
    return res.status(400).send("Missing blogID header");
  }

  // Check with the database that the blog is connected to the iCloud Drive
  const blog = await database.get(blogID);

  if (!blog || !blog.sharingLink) {
    return res.status(400).send("Blog is not connected to iCloud Drive");
  }

  if (!blog.setupComplete) {
    return res.status(400).send("Blog setup is not complete");
  }

  next();
}

// Apply the middleware to all routes
site.use(verifyAuthorization); // This will apply to all routes below

site.use(express.raw({ type: "application/octet-stream", limit: maxiCloudFileSize })); // For handling binary data

// Ping endpoint
site.get("/ping", async function (req, res) {
  res.send("pong");
});

site.post("/setup-complete", async function (req, res) {
  const blogID = req.header("blogID");
  res.send("ok");

  // establish sync lock
  const { folder, done } = await establishSyncLock(blogID);
  folder.status("Setting up iCloud sync");
  await syncToiCloud(blogID, folder.status, folder.update);
  await database.store(blogID, { setupComplete: true });
  folder.status("Setup complete");
  await done();
});

// Upload endpoint (handles binary files)
site.post("/upload", checkBlogUsesICloud, async function (req, res) {
  try {
    const blogID = req.header("blogID");
    const filePath = req.header("path");
    const modifiedTime = req.header("modifiedTime");

    // Validate required headers
    if (!blogID || !filePath) {
      return res.status(400).send("Missing required headers: blogID or path");
    }

    console.log(
      `Uploading binary file for blogID: ${blogID}, path: ${filePath}`
    );

    // Establish sync lock to allow safe file operations
    const { done, folder } = await establishSyncLock(blogID);

    try {
      // Compute the local file path on disk
      const pathOnDisk = localPath(blogID, filePath);

      folder.status("Saving " + filePath);

      // Ensure the directory exists and write the binary data to the file
      // Write the binary data (req.body is raw binary)
      await fs.outputFile(pathOnDisk, req.body);

      // Use the iso string modifiedTime if provided
      if (modifiedTime) {
        const modifiedTimeDate = new Date(modifiedTime);
        await fs.utimes(pathOnDisk, modifiedTimeDate, modifiedTimeDate);
      }

      // Call the folder's update method to register the file change
      await folder.update(filePath);

      // Set the folder status to reflect the upload action
      folder.status("Updated " + filePath);

      console.log(`File successfully written to: ${pathOnDisk}`);
      res.status(200).send(`File successfully uploaded for blogID: ${blogID}`);
    } finally {
      // Release the sync lock
      done();
    }
  } catch (err) {
    console.error("Error in /upload:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Delete endpoint
site.post("/delete", checkBlogUsesICloud, async function (req, res) {
  try {
    const blogID = req.header("blogID");
    const filePath = req.header("path");

    // Validate required headers
    if (!blogID || !filePath) {
      return res.status(400).send("Missing required headers: blogID or path");
    }

    console.log(`Deleting file for blogID: ${blogID}, path: ${filePath}`);

    // Establish sync lock to allow safe file operations
    const { done, folder } = await establishSyncLock(blogID);

    try {
      // Compute the local file path on disk
      const pathOnDisk = localPath(blogID, filePath);

      console.log(`Deleting file at: ${pathOnDisk}`);

      // Remove the file (if it exists)
      await fs.remove(pathOnDisk); // Removes the file or directory

      // Call the folder's update method to register the file deletion
      await folder.update(filePath);

      // Set the folder status to reflect the delete action
      folder.status("Removed " + filePath);

      console.log(`File successfully deleted: ${pathOnDisk}`);
      res.status(200).send(`File successfully deleted for blogID: ${blogID}`);
    } catch (err) {
      if (err.code === "ENOENT") {
        // File does not exist
        console.warn(`File not found: ${filePath}`);
        res.status(404).send("File not found");
      } else {
        throw err; // Re-throw unexpected errors
      }
    } finally {
      // Release the sync lock
      done();
    }
  } catch (err) {
    console.error("Error in /delete:", err);
    res.status(500).send("Internal Server Error");
  }
});

site.post("/mkdir", checkBlogUsesICloud, async function (req, res) {
  try {
    const blogID = req.header("blogID");
    const dirPath = req.header("path");

    // Validate required headers
    if (!blogID || !dirPath) {
      return res.status(400).send("Missing required headers: blogID or path");
    }

    console.log(`Creating directory for blogID: ${blogID}, path: ${dirPath}`);

    // Establish sync lock to allow safe file operations
    const { done, folder } = await establishSyncLock(blogID);

    try {
      // Compute the local directory path on disk
      const pathOnDisk = localPath(blogID, dirPath);

      console.log(`Creating directory at: ${pathOnDisk}`);

      // Ensure the directory exists
      await fs.ensureDir(pathOnDisk); // Creates the directory if it does not exist

      // Call the folder's update method to register the directory creation
      await folder.update(dirPath);

      // Set the folder status to reflect the mkdir action
      folder.status("Created " + dirPath);

      console.log(`Directory successfully created: ${pathOnDisk}`);
      res.status(200).send(`Directory successfully created for blogID: ${blogID}`);
    } finally {
      // Release the sync lock
      done();
    }
  } catch (err) {
    console.error("Error in /mkdir:", err);
    res.status(500).send("Internal Server Error");
  }
});


module.exports = site;
