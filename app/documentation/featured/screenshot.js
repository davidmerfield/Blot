const screenshot = require("helper/screenshot");
const root = require("helper/rootDir");
const { join } = require("path");

(async function (sites) {
  for (const { link, host } of sites) {
    const path = join(root, "app/views/images/sites", host + ".png");

    // ratio 1.60781421
    const options = {
      width: 1400,
      height: 870,
    };
    
    await screenshot(link, path, options);
  }
})(require("./featured-checked.json"));
