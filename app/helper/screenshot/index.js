const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

async function main(site, path, options = {}) {
  // Launch Puppeteer with Chromium and required arguments for Docker/Node Alpine
  const browser = await puppeteer.launch({
    headless: "new", // Use modern headless mode for Chromium
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
      "--force-color-profile=srgb"
    ],
  });

  const page = await browser.newPage();

  // Set a user agent for the page
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  );

  // Determine viewport width and height from options or defaults
  const width =
    options.width !== undefined
      ? options.width
      : options.mobile === true
      ? 400
      : 1260;

  const height =
    options.height !== undefined
      ? options.height
      : options.mobile === true
      ? 650
      : 778;

  // Set the viewport size and device scale factor
  await page.setViewport({
    width: width,
    height: height,
    deviceScaleFactor: 2,
  });

  // Ensure the directory for the output file exists
  await fs.ensureDir(dirname(path));

  // Navigate to the site and wait for network to be idle
  await page.goto(site, { waitUntil: "networkidle0", timeout: 20000 });

  // Capture a screenshot at max resolution
  await page.screenshot({
    path: path,
    type: "png",
    omitBackground: true,
  });

  // Close the browser
  await browser.close();

  // Compress the screenshot using imagemin
  try {
    await imagemin([path], {
      destination: dirname(path),
      plugins: [imageminPngquant()],
    });  
  } catch (e) {
    console.error("Error compressing screenshot:", e);
  }
}

module.exports = main;