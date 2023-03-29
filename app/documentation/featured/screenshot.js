// ratio 1.60781421
const screenshot = require("helper/screenshot");

(async function (sites) {
  for (const { link, host } of sites) {
    console.log('screenshotting', link);
    await screenshot(link, __dirname + "/data/" + host + ".png", {
      width: 1400,
      height: 870,
    });
  }
})(require("./featured-checked.json"));
