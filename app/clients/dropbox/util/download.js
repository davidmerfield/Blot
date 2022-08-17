const fs = require("fs-extra");
const uuid = require("uuid/v4");
const clfdate = require("helper/clfdate");
const promisify = require("util").promisify;
const setMtime = promisify(require("./setMtime"));
const retry = require("./retry");

async function download(client, source, destination, callback) {
  const id = uuid();
  const prefix = () =>
    clfdate() + " clients:dropbox:download:" + id.slice(0, 6);

  console.log(prefix(), source);

  const timeout = setTimeout(function () {
    console.log(prefix(), "reached timeout for download");
    cleanup(new Error("Timeout reached for download"));
  }, 4 * 60 * 1000); // 4 minutes

  const cleanup = function (err) {
    clearTimeout(timeout);
    console.log(prefix(), "calling back with err = ", err);
    callback(err);
  };

  try {
    const { result } = await client.filesDownload({ path: source });
    console.log("here", result);
    await fs.outputFile(destination, result.fileBinary);
    await setMtime(destination, result.client_modified);
  } catch (err) {
    return cleanup(err);
  }

  cleanup();
}

module.exports = retry(download);
