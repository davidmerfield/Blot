const puppeteer = require("puppeteer");
const imagemin = require("imagemin");
const imageminPngquant = require("imagemin-pngquant");
const dirname = require("path").dirname;
const fs = require("fs-extra");

console.log("MADE IT HERE TOO!");

async function main () {
  
  const { site, path, options } = JSON.parse(process.argv[2]);

  console.log("MADE IT HERE TOO!");
  
  const browser = await puppeteer.launch({
    product: "firefox",
    headless: "new", // Ensure modern headless mode is used
    args: [ 
      "--font-render-hinting=none", 
      "--force-color-profile=srgb", 
      "--no-sandbox", 
      "--disable-setuid-sandbox"      
    ],
  });

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
      ? 400
      : 1260;

  const height =
    options.height !== undefined
      ? options.height
      : options.mobile === true
      ? 650
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
  // it's important to capture the screenshot in max resolution
  // and without compression so multiple iterations on the same
  // page produce the same result when diffed
  await page.screenshot({
    path: path,
    type: "png",
    omitBackground: true
  });

  // console.log('took screenshot');
  await browser.close();
  // console.log('closed browser');

  await imagemin([path], dirname(path), {
    plugins: [imageminPngquant()]
  });
}

main();