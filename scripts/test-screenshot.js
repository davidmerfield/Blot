const { callbackify } = require("util");
const screenshot = callbackify(require("helper/screenshot"));
const SCREENSHOT_WIDTH = 1060;
const SCREENSHOT_HEIGHT = 1060;

const url = process.argv[2];
const path = process.argv[3];

console.log("url", url);
console.log("path", path);

console.log("screenshot....");

screenshot(
  url,
  path,
  { width: SCREENSHOT_WIDTH, height: SCREENSHOT_HEIGHT },
  function (err) {
    if (err) {
      console.log("Error fetching screenshot", err);
    }

    console.log("Valid screenshot", url, path);
  }
);
