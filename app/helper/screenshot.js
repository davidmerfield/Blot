const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

const firefoxOptions =
  process.env.PUPETEER_PRODUCT === "firefox"
    ? {
        product: "firefox",
        args: ["--font-render-hinting=none", "--force-color-profile=srgb"]
      }
    : {};

async function main (site, path, options = {}) {
  // console.log('launching');

  const browser = await puppeteer.launch(firefoxOptions);

  // console.log('launched');
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
  );

  // console.log('using options', options);

  const width =
    options.width !== undefined
      ? options.width
      : options.mobile === true
      ? 562
      : 1260;
  const height =
    options.height !== undefined
      ? options.height
      : options.mobile === true
      ? 1218
      : 778;

  // console.log('using width', width, 'height', height);

  // console.log('setting viewport')
  await page.setViewport({
    width: width,
    height: height,
    deviceScaleFactor: 2
  });

  // console.log('going to site',site);
  await fs.ensureDir(dirname(path));
  // page.goto site and wait for all the images to load
  // up to a maximum of 20 seconds
  await page.goto(site, { waitUntil: "networkidle0", timeout: 20000 });

  // console.log('went to site');
  await page.screenshot({ path: path });
  // console.log('took screenshot');
  await browser.close();
  // console.log('closed browser');

  await imagemin([path], dirname(path), {
    plugins: [imageminPngquant()]
  });
}

module.exports = main;
