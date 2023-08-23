const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

const firefoxOptions = {
  product: "firefox",
}

async function main(site, path, options = {}) {

  // console.log('launching');

  const browser = await puppeteer.launch(firefoxOptions);

  // console.log('launched');
  const page = await browser.newPage();

  // console.log('using options', options);

  const width = options.width !== undefined ? options.width : options.mobile === true ? 562 : 1260;
  const height = options.height !== undefined ? options.height : options.mobile === true ? 1218 : 778;

  // console.log('using width', width, 'height', height);

  // console.log('setting viewport')
  await page.setViewport({
    width: width,
    height: height,
    deviceScaleFactor: 2,
  });

  // console.log('going to site',site);
  await fs.ensureDir(dirname(path));
  await page.goto(site);
  // console.log('went to site');
  await page.screenshot({ path: path });
  // console.log('took screenshot');
  await browser.close();
  // console.log('closed browser');

  await imagemin([path], dirname(path), {
    plugins: [imageminPngquant()],
  });
}

module.exports = main;
