const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

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

  await page.goto(site);
  await fs.ensureDir(dirname(path));
  await page.screenshot({ path: path });
  await browser.close();
  await imagemin([path], dirname(path), {
    plugins: [imageminPngquant()],
  });
}

module.exports = main;
