const puppeteer = require("puppeteer");
const { dirname } = require("path");
const fs = require("fs-extra");
const Bottleneck = require("bottleneck");

const CONFIG = {
  DEFAULT_MAX_PAGES: 2,

  DEFAULT_RESTART_INTERVAL: 1000 * 60 * 60, // 1 hour
  
  // 1 screenshot per second rate limit
  // be careful about increasing this, sometimes it
  // causes screenshot() to hang indefinitely
  // https://stackoverflow.com/a/78272496
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
    this.pagePool = new Map();
    this.screenshotCount = 0;
    this.lastRestartTime = Date.now();
    
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

  async acquirePage(maxPages) {
    await this.initialize();

    // Check if restart is needed
    if (Date.now() - this.lastRestartTime >= CONFIG.DEFAULT_RESTART_INTERVAL) {
      await this.restart();
    }

    // Find an available page or create new one
    for (const [page, inUse] of this.pagePool) {
      if (!inUse) {
        this.pagePool.set(page, true);
        return page;
      }
    }

    // Create new page if under limit
    if (this.pagePool.size < maxPages) {
      const page = await this.createPage();
      this.pagePool.set(page, true);
      return page;
    }

    // Wait for a page to become available
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        for (const [page, inUse] of this.pagePool) {
          if (!inUse) {
            clearInterval(interval);
            this.pagePool.set(page, true);
            resolve(page);
            return;
          }
        }
      }, 100);
    });
  }

  async releasePage(page) {
    if (!page || !this.pagePool.has(page)) {
      console.error("Invalid page");
      return;
    } 

    try {
      console.log('going to about:blank');
      await page.goto("about:blank", { waitUntil: "load", timeout: 5000 });
      console.log('closing page');
    } catch (e) {
      // Ignore navigation errors
    }

    console.log('releasing page');
    this.pagePool.set(page, false);
  }

  async restart() {
    console.log("Restarting browser");
    await this.cleanup();
    await this.initialize();
    this.lastRestartTime = Date.now();
    this.screenshotCount = 0;
  }

  async cleanup() {
    if (this.browser) {
      for (const page of this.pagePool.keys()) {
        await page.close().catch(() => {});
      }
      this.pagePool.clear();
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  async takeScreenshot(site, path, options = {}) {
    const maxPages = options.maxPages || CONFIG.DEFAULT_MAX_PAGES;
    const page = await this.acquirePage(maxPages);

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
      console.log('releasing page');
      await this.releasePage(page);
    }
  }
}

const manager = new ScreenshotManager();

// Export main function
module.exports = async (site, path, options = {}) => {
  return manager.limiter.schedule(() => manager.takeScreenshot(site, path, options));
};