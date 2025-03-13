const puppeteer = require("puppeteer");
const { dirname } = require("path");
const fs = require("fs-extra");
const Bottleneck = require("bottleneck");

const CONFIG = {
  DEFAULT_MAX_PAGES: 2,
  DEFAULT_RESTART_INTERVAL: 1000 * 60 * 60, // 1 hour
  MIN_TIME_BETWEEN_OPS: 1000,
  BROWSER_ARGS: require("./args"),
  DEFAULT_USER_AGENT:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  PAGE_TIMEOUT: 20000,
  VIEWPORT: {
    desktop: { width: 1260, height: 778 },
    mobile: { width: 400, height: 650 },
  },
};

class ScreenshotManager {
  constructor() {
    this.browser = null;
    this.activePages = 0;
    this.screenshotCount = 0;
    this.lastRestartTime = Date.now();
    this.isRestarting = false;

    this.limiter = new Bottleneck({
      maxConcurrent: CONFIG.DEFAULT_MAX_PAGES,
      minTime: CONFIG.MIN_TIME_BETWEEN_OPS,
    });

    // Handle cleanup on process termination
    process.on("SIGINT", () => this.cleanup());
    process.on("SIGTERM", () => this.cleanup());
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: "new",
        devtools: false,
        args: CONFIG.BROWSER_ARGS,
        ignoreDefaultArgs: ["--disable-extensions"],
      });
    }
  }

  async createPage() {
    const page = await this.browser.newPage();
    await page.setUserAgent(CONFIG.DEFAULT_USER_AGENT);
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
      await new Promise(resolve => setTimeout(resolve, 100));
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

    try {
      const viewport = options.mobile ? CONFIG.VIEWPORT.mobile : CONFIG.VIEWPORT.desktop;
      await page.setViewport({
        width: options.width ?? viewport.width,
        height: options.height ?? viewport.height,
        deviceScaleFactor: 2,
      });

      await fs.ensureDir(dirname(path));

      console.log('going to', site);
      await page.goto(site, {
        waitUntil: "networkidle0",
        timeout: CONFIG.PAGE_TIMEOUT,
      });

      console.log('screenshotting', site, 'to', path);
      await page.screenshot({
        path,
        type: "png",
        omitBackground: true,
      });

      this.screenshotCount++;
    } finally {
      console.log('closing page');
      await page.close().catch(() => {});
      this.activePages--;

      // If we are restarting, wait until the restart is complete to hold the queue
      if (this.isRestarting) {
        console.log("Waiting for restart to complete");
        while (this.isRestarting) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log("Restart complete");
      }

      // Check if restart is needed after the screenshot is complete
      if (Date.now() - this.lastRestartTime >= CONFIG.DEFAULT_RESTART_INTERVAL) {
        // Schedule restart without awaiting it
        this.restart().catch(console.error);
      }
    }
  }
}

const manager = new ScreenshotManager();

// Export main function
module.exports = async (site, path, options = {}) => {
  return manager.limiter.schedule(() => manager.takeScreenshot(site, path, options));
};

// Export restart function for testing
module.exports.restart = () => manager.restart();