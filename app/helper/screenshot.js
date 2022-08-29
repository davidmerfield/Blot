const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

// We wait 1s by default on all pages before 
// screenshotting, which gives enough time for
// fade in to happen on annoying websites.
const WAIT_DELAY = 1000;

async function main(site, path, options = {}) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  if (options.mobile) {
    const iPhone = puppeteer.devices["iPhone X"];
    await page.emulate(iPhone);
  } else {
    const width = options.width || 1260;
    const height = options.height || 778;

    await page.setViewport({
      width: width,
      height: height,
      deviceScaleFactor: 2,
    });
  }

  await fs.ensureDir(dirname(path));
  await page.goto(site);
  await page.waitForTimeout(WAIT_DELAY);
  await page.screenshot({ path: path });
  await browser.close();
  await imagemin([path], dirname(path), {
    plugins: [imageminPngquant()],
  });
}

module.exports = main;
