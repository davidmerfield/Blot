const colors = require("colors/safe");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const parseCSS = require("css");
const fetch = require("node-fetch");
const { parse, resolve } = require("url");
const { join, extname } = require("path");
const { blot_directory } = require('config');

const TMP_CACHE = join(blot_directory, 'data/tmp/unused-css-cache.html');
const CSS_DIR = join(blot_directory, 'app/views/css');


const loadCSS = async (filesToSkip) => {
    const CSS_DIR_CONTENTS = await fs.readdir(CSS_DIR);

    const CSS_FILES = CSS_DIR_CONTENTS.filter((filename) => filename.endsWith(".css") && !filesToSkip.includes(filename));

    const CSS = await Promise.all(CSS_FILES.map(async (filename) => {
      const css = await fs.readFile(join(CSS_DIR, filename), "utf-8");
      return css;
    }));

    const PARSED_CSS = CSS.map((css, i) => {
      try {
        const result = parseCSS.parse(css);
        return { rules: result.stylesheet.rules, filename: CSS_FILES[i]};
      } catch (e) {
        throw new Error("Error parsing CSS: " + CSS_DIR + "/" + CSS_FILES[i]);
      }
    });

    return PARSED_CSS;
};

const crawl = async ({ origin, headers, cache }) => {

    if (cache && fs.existsSync(TMP_CACHE)) {
        console.log('Using cached HTML');
        return await fs.readFile(TMP_CACHE, 'utf-8');
    }

  let res = "";
  let checked = {};

  const checkPage = async (base, url) => {
    const { pathname } = parse(url);

    if (checked[pathname]) return;

    checked[pathname] = true;

    const parsedURL = parse(url);
    const extension = extname(parsedURL.pathname);

    if (extension) {
      console.log(colors.yellow("SKIP", parsedURL.pathname));
      return;
    }

    console.log(colors.dim(" GET " + parsedURL.pathname));

    try {
      const response = await fetch(url, { headers: headers || {} });

      if (response.status !== 200 && response.status !== 400) {
        console.log(colors.red(" " + response.status + " " + parsedURL.pathname));
        throw new Error("Bad status: " + response.status + " on " + url);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("text/html") === -1) {
        return;
      }

      const body = await response.text();
      let $;

      try {
        $ = cheerio.load(body);
      } catch (e) {
        throw new Error("Error loading HTML with cheerio: " + e.message);
      }

      console.log(colors.green(" GOT " + parsedURL.pathname));
      res += $("body").html();

      await parseURLs(url, $);
    } catch (error) {
      console.error(colors.red("Error fetching URL: "), error);
      throw error;
    }
  };

  const parseURLs = async (base, $) => {
    let URLs = [];

    $("[href],[src]").each(function () {
      let url = $(this).attr("href") || $(this).attr("src");

      if (!url) return;

      url = resolve(base, url);

      if (parse(url).host !== parse(base).host) return;

      URLs.push(url);
    });

    for (const url of URLs) {
      await checkPage(base, url);
    }
  };

  console.log('Checking page', origin);
  await checkPage(null, origin);

  const result =  `<html><body>${res}</body></html>`;

  if (cache) {
    await fs.outputFile(TMP_CACHE, result);
  }

  return result;
};

module.exports = async ({ origin, headers = {}, filesToSkip = [], cache = false }) => {
  if (!origin) throw new Error("origin is required");

  console.log("Crawling HTML on site...", origin);

  const css = await loadCSS(filesToSkip);

  console.log("Loaded CSS", css);

    const HTML = await crawl({ origin, headers, cache });

    const $ = cheerio.load(HTML);
    const result = [];

    css.forEach(( { rules, filename }) => {
        rules.forEach(sortRule($, filename, result));
    });
    if (result.length > 0) {
        let errorMessage = 'Error: unused CSS rules detected\n';

        const fileMap = new Map();

        result.forEach(({ selector, rule, filename }) => {
            if (!fileMap.has(filename)) {
                fileMap.set(filename, []);
            }
            fileMap.get(filename).push({ selector, rule });
        });

        fileMap.forEach((selectors, filename) => {
            errorMessage += colors.dim(CSS_DIR + "/") + filename + "\n";
            selectors.forEach(({ selector, rule }) => {
                errorMessage += '  ' + colors.red(selector) + '\n';
                errorMessage += colors.dim("    " + CSS_DIR + "/" + filename + ':' + rule.position.start.line + "\n");
            });
        });

        throw new Error(errorMessage);
    }

    console.log('No unused CSS rules detected');
};

const sortRule = ($, filename, result) => (rule) => {

    // Recurse into the rules inside @media {} query blocks
    if (rule.type === "media") return rule.rules.forEach((r) => sortRule($, filename, result)(r));

    if (rule.type !== "rule") return;

    rule.selectors.forEach((selector) => {

        if (["@font-face", "@import"].find(skip => selector.indexOf(skip) > -1)) return;

        console.log('checking', selector);

        const pseudoSelectorsToRemove = [
            "focus-within", "focus", "before", "after",
            "hover", "active", "marker", "placeholder", "-webkit-details-marker", "-webkit-input-placeholder",
            "-moz-placeholder", "-ms-input-placeholder", "selection", "first-letter", "first-line"];

        const regex = new RegExp(pseudoSelectorsToRemove.map(remove => ":?:" + remove).join("|"), "g");

        selector = selector.replace(regex, "");
            
        // the selector is present in the HTML
        if ($(selector).length > 0) {
            return;
        }
        
        // we found a missing selector
        result.push({ selector, rule, filename });
    });
}


if (require.main === module) {
    // when testing local.blot, we need to disable SSL checks
    // to fix UNABLE_TO_VERIFY_LEAF_SIGNATURE error
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

   module.exports({ 
    origin: 'https://local.blot', 
    cache: true,
    filesToSkip: ['tex.css', 'finder-window.css']
  });
}
