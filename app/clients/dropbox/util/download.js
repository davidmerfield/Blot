const fs = require("fs-extra");
const uuid = require("uuid/v4");
const clfdate = require("helper/clfdate");
const promisify = require("util").promisify;
const setMtime = promisify(require("./setMtime"));
const retry = require("./retry");
const callOnce = require("helper/callOnce");

const TIMEOUT = 30 * 1000; // 30 seconds

async function download(client, source, destination, callback) {
  const id = uuid();
  const prefix = () =>
    clfdate() + " clients:dropbox:download:" + id.slice(0, 6);
  let timedOut = false;

  console.log(prefix(), source);

  const timeout = setTimeout(function () {
    timedOut = true;
    console.log(prefix(), "reached timeout for download");
    cleanup(new Error("Timeout reached for download"));
  }, TIMEOUT);

  // Otherwise the timeout triggers a double callback
  const cleanup = callOnce(function (err) {
    clearTimeout(timeout);
    console.log(prefix(), "calling back with err = ", err);
    callback(err);
  });

  try {
    const { result } = await client.filesDownload({ path: source });
    if (timedOut) return;
    await fs.outputFile(destination, result.fileBinary);
    if (timedOut) return;
    await setMtime(destination, result.client_modified);
    if (timedOut) return;
  } catch (err) {
    return cleanup(err);
  }

  if (timedOut) return;
  cleanup();
}

module.exports = retry(download);
