const puppeteer = require("puppeteer");
const { dirname } = require("path");
const fs = require("fs-extra");
const Bottleneck = require("bottleneck");
const retry = require("./retry");
const clfdate = require("helper/clfdate");

const prefix = () => `${clfdate()} Screenshot:`;

// CONFIG

// These seem slow but chromium seems to panic if we go too fast
// so be careful when changing these
const CONCURRENT_SCREENSHOTS = 1;
const MIN_TIME_BETWEEN_OPS = 2000; // 2 seconds

// How often to restart the browser to avoid memory leaks
const DEFAULT_RESTART_INTERVAL = 1000 * 60 * 60; // 1 hour

const BROWSER_ARGS = require("./args");
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";

const PAGE_TIMEOUT = 20000;
const VIEWPORT = {
  desktop: { width: 1260, height: 778 },
  mobile: { width: 400, height: 650 },
};

let browser = null;
let lastRestartTime = Date.now();
let isRestarting = false;

let limiter = new Bottleneck({
  maxConcurrent: CONCURRENT_SCREENSHOTS,
  minTime: MIN_TIME_BETWEEN_OPS,
});

async function initialize() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: "new",
      devtools: false,
      args: BROWSER_ARGS,
      ignoreDefaultArgs: ["--disable-extensions"],
    });

    // open a single blank page to avoid the first page load delay
    const page = await browser.newPage();
    await page.goto("about:blank");
  }
}

async function restart() {
  console.log(prefix(), "Attempting browser restart");

  if (isRestarting) {
    console.log(prefix(), "Already restarting, skipping");
    return;
  }

  isRestarting = true;

  console.log(prefix(), "Closing browser");
  await cleanup();

  console.log(prefix(), "Browser closed, restarting now");
  await initialize();

  console.log(prefix(), "Browser restarted successfully");
  lastRestartTime = Date.now();
  isRestarting = false;
}

async function cleanup() {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

async function takeScreenshot(site, path, options = {}) {
  await initialize();

  const page = await browser.newPage();
  await page.setUserAgent(DEFAULT_USER_AGENT);

  const viewport = options.mobile ? VIEWPORT.mobile : VIEWPORT.desktop;
  await page.setViewport({
    width: options.width ?? viewport.width,
    height: options.height ?? viewport.height,
    deviceScaleFactor: 2,
  });

  await fs.ensureDir(dirname(path));

  console.log(prefix(), "Navigating browser to", site);
  await page.goto(site, {
    waitUntil: "networkidle0",
    timeout: PAGE_TIMEOUT,
  });

  console.log(prefix(), "Taking screenshot of ", site, "to", path);
  try {
    await screenshotWithTimeout(page, path, options);
  } catch (e) {
    // if this fails we need to restart the browser
    console.error("Failed to call page.screenshot, restarting browser", e);
    await restart();
  }

  console.log(prefix(), "closing page");
  await closePageWithTimeout(page);

  // Check if restart is needed after the screenshot is complete
  if (Date.now() - lastRestartTime >= DEFAULT_RESTART_INTERVAL) {
    await restart();
  }
}

// This sometimes hangs, so we wrap it in a timeout
async function closePageWithTimeout(page) {
  try {
    return await Promise.race([
      page.close(),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error("Timeout calling page.close() after 2 seconds")),
          2000
        )
      ),
    ]);
  } catch (e) {
    throw new Error(`Failed to close page: ${e.message}`);
  }
}

// This sometimes hangs, so we wrap it in a timeout
async function screenshotWithTimeout(page, path) {
  try {
    return await Promise.race([
      page.screenshot({
        path,
        type: "png",
        omitBackground: true,
      }),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error("Timeout calling page.screenshot() after 2 seconds")
            ),
          2000
        )
      ),
    ]);
  } catch (e) {
    throw new Error(`Failed to take screenshot: ${e.message}`);
  }
}

// Export main function
module.exports = async (site, path, options = {}) => {
  return retry(() =>
    limiter.schedule(() => takeScreenshot(site, path, options))
  );
};

// Export restart function for testing
module.exports.restart = restart;
