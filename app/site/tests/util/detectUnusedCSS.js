const colors = require("colors/safe");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const parseCSS = require("css");
const fetch = require("node-fetch");
const { parse, resolve } = require("url");
const { join, extname } = require("path");
const { blot_directory } = require('config');
const recursiveReadDir = require("helper/recursiveReadDirSync");

const TMP_CACHE = join(blot_directory, 'data/tmp/unused-css-cache.html');

const CSS_SOURCE_FILES = recursiveReadDir(join(blot_directory, 'app/views/css')).filter(i => i.endsWith(".css")).map(i => ({
  path: i,
  contents: fs.readFileSync(i, 'utf-8')
}));

const fetchHTML = async (url, headers) => {
  const response = await fetch(url, { headers });
  if (![200, 400].includes(response.status)) {
    throw new Error(`Bad status: ${response.status} on ${url}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("text/html")) return null;

  return response.text();
};

const loadCSSFiles = async (origin, headers) => {
  const indexHTML = await fetchHTML(origin, headers);
  if (!indexHTML) throw new Error("Unable to fetch index page");

  const $ = cheerio.load(indexHTML);
  const cssLinks = $("link[rel='stylesheet']");

  const cssContents = await Promise.all(cssLinks.map(async (i, link) => {
    const cssUrl = resolve(origin, $(link).attr('href'));
    console.log('Fetching CSS:', cssUrl);
    const cssContent = await fetch(cssUrl).then(res => res.text());
    console.log('Fetched CSS:', cssUrl, cssContent.length, 'bytes');
    return { css: cssContent, filename: cssUrl };
  }).get());

  return cssContents.map(({ css, filename }) => {
    try {
      const result = parseCSS.parse(css);
      return { rules: result.stylesheet.rules, filename };
    } catch (e) {
      throw new Error(`Error parsing CSS from URL: ${filename}`);
    }
  });
};

const processPage = async ({ origin, headers, visitedPages, htmlContent }) => {
  const queue = [origin];
  while (queue.length) {
    const url = queue.shift();
    const { pathname } = parse(url);

    if (visitedPages[pathname]) continue;
    visitedPages[pathname] = true;

    if (extname(pathname)) {
      console.log(colors.yellow("SKIP", pathname));
      continue;
    }

    console.log(colors.dim(" GET " + pathname));
    try {
      const body = await fetchHTML(url, headers);
      if (!body) continue;
      
      const $ = cheerio.load(body);
      console.log(colors.green(` GOT ${pathname}`));
      htmlContent.push($("body").html());

      $("[href],[src]").each(function () {
        const resourceUrl = $(this).attr("href") || $(this).attr("src");
        if (resourceUrl) {
          const fullUrl = resolve(url, resourceUrl);
          if (parse(fullUrl).host === parse(url).host) {
            queue.push(fullUrl);
          }
        }
      });
    } catch (error) {
      console.error(colors.red("Error fetching URL: "), error);
      throw error;
    }
  }
};

const crawlSite = async ({ origin, headers, cache }) => {
  if (cache && await fs.exists(TMP_CACHE)) {
    console.log('Using cached HTML');
    return fs.readFile(TMP_CACHE, 'utf-8');
  }

  const visitedPages = {};
  const htmlContent = [];
  await processPage({ origin, headers, visitedPages, htmlContent });

  const result = `<html><body>${htmlContent.join('')}</body></html>`;
  if (cache) {
    await fs.outputFile(TMP_CACHE, result);
  }
  
  return result;
};

const removePseudoSelectors = (selector) => {
  const pseudoSelectors = [
    "focus-within", "focus", "before", "after", "hover", "active", "marker", "placeholder",
    "checked", "disabled",
    "-webkit-details-marker", "-webkit-input-placeholder", "-moz-placeholder", "-ms-input-placeholder",
    "selection", "first-letter", "first-line", "-moz-selection"
  ];

  const regex = new RegExp(pseudoSelectors.map(pseudo => `:?::?${pseudo}`).join("|"), "g");
  return selector.replace(regex, "");
};

const findSourceFileForRule = (selector) => {
  for (const { path, contents } of CSS_SOURCE_FILES) {
    const parsedCSS = parseCSS.parse(contents);
    for (const rule of parsedCSS.stylesheet.rules) {
      if (rule.type === "rule" && rule.selectors.includes(selector)) {
        return path;
      }
    }
  }
  return null;
};

const processCSSRule = ($, filename, unusedCSSRules, selectorsToSkip) => (rule) => {
  if (rule.type === "media") {
    rule.rules.forEach(processCSSRule($, filename, unusedCSSRules, selectorsToSkip));
    return;
  }

  if (rule.type !== "rule") return;

  
  rule.selectors.forEach(selector => {
    if (selectorsToSkip.find(skip => selector.indexOf(skip) > -1)) {
      console.log('skipping', selector);
      return;
    } else {
      console.log('checking', selector);
    }
    const normalizedSelector = removePseudoSelectors(selector);
    if ($(normalizedSelector).length > 0) return;

    const sourceFile = findSourceFileForRule(selector) || filename;
    unusedCSSRules.push({ selector, rule, sourceFile });
  });
};

module.exports = async ({ origin, headers = {}, selectorsToSkip = [], cache = false }) => {
  if (!origin) throw new Error("origin is required");

  console.log("Crawling HTML on site...", origin);

  const css = await loadCSSFiles(origin, headers);
  console.log("Loaded CSS", css);

  const HTML = await crawlSite({ origin, headers, cache });
  const $ = cheerio.load(HTML);
  const unusedCSSRules = [];

  css.forEach(({ rules, filename }) => {
    rules.forEach(processCSSRule($, filename, unusedCSSRules, selectorsToSkip));
  });

  if (unusedCSSRules.length > 0) {
    const fileMap = new Map();

    unusedCSSRules.forEach(({ selector, rule, sourceFile }) => {
      if (!fileMap.has(sourceFile)) {
        fileMap.set(sourceFile, []);
      }
      fileMap.get(sourceFile).push({ selector, rule });
    });

    const errorMessage = Array.from(fileMap.entries()).reduce((message, [sourceFile, selectors]) => {
      message += "\n" + colors.dim(sourceFile) + "\n";
      selectors.forEach(({ selector, rule }) => {
        message += '  ' + colors.red(selector) + '\n';
        message += colors.dim(`    ${sourceFile}:${rule.position.start.line}\n`);
      });
      
      return message;
    }, 'Error: unused CSS rules detected\n') + '\nAfter checking the following files:\n\n' + css.map(({ filename }) => colors.dim(filename)).join('\n') + '\n';    

    throw new Error(errorMessage);
  }

  console.log('No unused CSS rules detected');
};

if (require.main === module) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  module.exports({
    origin: 'https://local.blot',
    cache: true,
    selectorsToSkip: [
      "@font-face", 
      "@import", 

      '.katex', // katex
      
      '.hljs-', // highlight.js
      '.pcr-', // color picker
      '.pickr', // color picker,
      '.tagify', // tag input for questions section
      
      // code editor
      '.CodeMirror', 
      '.cm-',
    ]
  });
}