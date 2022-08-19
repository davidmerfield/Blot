module.exports = [
  {
    stage: "token",
    active: "Receiving permission to access your Dropbox",
    done: "Received permission to access your Dropbox",
  },
  {
    stage: "dropboxAccount",
    active: "Loading your Dropbox account information",
    done: "Loaded your Dropbox account information",
  },
  {
    stage: "moveExistingFiles",
    active: "Moving your existing blog folder into a subdirectory",
    done: "Moved your existing blog folder into a subdirectory",
  },
  {
    stage: "createFolder",
    active: "Creating a folder in Dropbox for your blog",
    done: "Created a folder in Dropbox for your blog",
  },
  {
    stage: "writeExistingContents",
    active: "Transferring the files in your blog folder",
    done: "Transferred the files in your blog folder",
  },
  {
    stage: "saveDropboxAccount",
    active: "Saving your Dropbox account details",
    done: "Saved your Dropbox account details",
  },
];
