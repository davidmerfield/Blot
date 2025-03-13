const puppeteer = require("puppeteer");
const { dirname } = require("path");
const fs = require("fs-extra");
const Bottleneck = require("bottleneck");
const retry = require("./retry");

// CONFIG
const DEFAULT_MAX_PAGES = 2;
const DEFAULT_RESTART_INTERVAL = 1000 * 60 * 60; // 1 hour
const MIN_TIME_BETWEEN_OPS = 1000;
const BROWSER_ARGS = require("./args");
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36";
const PAGE_TIMEOUT = 20000;
const VIEWPORT = {
  desktop: { width: 1260, height: 778 },
  mobile: { width: 400, height: 650 },
};

class ScreenshotManager {
  constructor() {
    this.browser = null;
    this.activePages = 0;
    this.screenshotCount = 0;
    this.lastRestartTime = Date.now();
    this.isRestarting = false;

    this.limiter = new Bottleneck({
      maxConcurrent: DEFAULT_MAX_PAGES,
      minTime: MIN_TIME_BETWEEN_OPS,
    });
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        devtools: false,
        args: BROWSER_ARGS,
        ignoreDefaultArgs: ["--disable-extensions"],
      });

      // open a single blank page to avoid the first page load delay
      const page = await this.createPage();
      await page.goto("about:blank");
    }
  }

  async createPage() {
    const page = await this.browser.newPage();
    await page.setUserAgent(DEFAULT_USER_AGENT);
    await page.setRequestInterception(true);

    page.on("request", (request) => {
      request.continue();
    });

    return page;
  }

  async restart() {
    console.log("Attempting browser restart");
    if (this.isRestarting) {
      console.log("Already restarting, skipping");
      return;
    }

    this.isRestarting = true;
    console.log("Waiting for pending pages to complete");

    // Wait for any pending page operations to complete
    while (this.activePages > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log("Closing browser");
    await this.cleanup();

    console.log("Browser closed, restarting now");
    await this.initialize();
    console.log("Browser restarted");
    this.lastRestartTime = Date.now();
    this.screenshotCount = 0;
    this.isRestarting = false;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
      this.activePages = 0;
    }
  }

  async takeScreenshot(site, path, options = {}) {
    await this.initialize();

    this.activePages++;
    const page = await this.createPage();
    let success = false;

    try {
      const viewport = options.mobile ? VIEWPORT.mobile : VIEWPORT.desktop;
      await page.setViewport({
        width: options.width ?? viewport.width,
        height: options.height ?? viewport.height,
        deviceScaleFactor: 2,
      });

      await fs.ensureDir(dirname(path));

      console.log("going to", site);
      await page.goto(site, {
        waitUntil: "networkidle0",
        timeout: PAGE_TIMEOUT,
      });

      console.log("screenshotting", site, "to", path);
      try {
        await Promise.race([
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
        // if we error here we need to restart the browser
        // this means it's locked up and even calls to close the page
        // will hang
        console.error("Error taking screenshot:", e.message);
        this.activePages = 0;
        await this.restart();
        console.log("Browser restarted, retrying screenshot");
        return this.takeScreenshot(site, path, options);
      }

      success = true;
      this.screenshotCount++;
    } finally {
      console.log("closing page");
      await page.close().catch((e) => {
        console.error("Failed to close page:", e.message);
      });
      console.log("page closed");
      
      this.activePages--;

      // If we are restarting, wait until the restart is complete to hold the queue
      if (this.isRestarting) {
        console.log("Waiting for restart to complete");
        while (this.isRestarting) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        console.log("Restart complete");
      }
      // Check if restart is needed after the screenshot is complete
      if (Date.now() - this.lastRestartTime >= DEFAULT_RESTART_INTERVAL) {
        // Schedule restart without waiting for it to complete
        this.restart().catch((error) => {
          console.error("Failed to restart browser:", error.message);
        });
      }

      if (!success) {
        console.error("Failed to take screenshot");
        throw new Error("Failed to take screenshot");
      }
    }
  }
}

const manager = new ScreenshotManager();

// Export main function
module.exports = async (site, path, options = {}) => {
  return retry(() =>
    manager.limiter.schedule(() => manager.takeScreenshot(site, path, options))
  );
};

// Export restart function for testing
module.exports.restart = () => manager.restart();
