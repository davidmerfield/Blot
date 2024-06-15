const colors = require("colors/safe");
const cheerio = require("cheerio");
const fs = require("fs-extra");
const parseCSS = require("css");
const fetch = require("node-fetch");
const { parse, resolve } = require("url");
const { join } = require("path");
const { blot_directory } = require('config');
const recursiveReadDir = require("helper/recursiveReadDirSync");

const TMP_CACHE = join(blot_directory, 'data/tmp/unused-css-cache.html');

const URLPathsToSkip = [
  // regex which matches /questions/:id/edit
  /\/questions\/\d+\/edit/,
  // regex which matches /questions/tagged/:tag
  // where tag is a url slug
  /\/questions\/tagged\/[a-z0-9-]+/,
  ];

const selectorsToSkip = [
  "@font-face", 
  "@import", 

  '.working', // loading spinner for buttons on click
  '.copied', // copy to clipboard button after copying

  '.katex', // katex
  
  '.hljs-', // highlight.js
  '.pcr-', // color picker
  '.pickr', // color picker,
  '.tagify', // tag input for questions section
  
  // code editor
  '.CodeMirror', 
  '.cm-',
];

const pseudoSelectors = [
  "focus-within", "focus", "before", "after", "hover", "active", "marker", "placeholder",
  "checked", "disabled", "empty",
  "-webkit-details-marker", "-webkit-input-placeholder", "-moz-placeholder", "-ms-input-placeholder",
  "selection", "first-letter", "first-line", "-moz-selection"
];

const CSS_SOURCE_FILES = recursiveReadDir(join(blot_directory, 'app/views/css')).filter(i => i.endsWith(".css")).map(i => ({
  path: i,
  contents: fs.readFileSync(i, 'utf-8')
}));

const loadHTMLViews = async() => {
  const htmlFiles = recursiveReadDir(join(blot_directory, 'app/views')).filter(i => i.endsWith(".html"));

  const html = htmlFiles.map(file => {
    let contents;
    try {
      contents = fs.readFileSync(file, 'utf-8');

      // if the contents includes <html> then we know it's a full HTML file so we can skip
      if (contents.includes('<html>')) {
        return ''
      }

      // if the contents includes <head>
      if (contents.includes('<head>')) {
        return '';
      }
    } catch (e) {
      throw new Error(`Error reading HTML file: ${file}`);
    }
    return contents;
  }).join('');

  return html;
}

const fetchHTML = async (url, headers) => {

  if (URLPathsToSkip.some(regex => regex.test(url))) {
    console.log('Skipping URL:', url);
    return null;
  }

  const response = await fetch(url, { headers });
  if (![200, 400].includes(response.status)) {
    throw new Error(`Bad status: ${response.status} on ${url}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && !contentType.includes("text/html")) return null;

  return response.text();
};

const loadCSSFiles = async (cssFilePaths) => {
 
  return cssFilePaths.map(path => {
    try {
      const contents = fs.readFileSync(path, 'utf-8');
      const result = parseCSS.parse(contents);
      return { rules: result.stylesheet.rules, filename: path.split('/').pop()};
    } catch (e) {
      throw new Error(`Error parsing CSS from: ${path}`);
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

    // if (extname(pathname)) {
    //   console.log(colors.yellow("SKIP", pathname));
    //   continue;
    // }

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

  const result = htmlContent.join('');

  if (cache) {
    await fs.outputFile(TMP_CACHE, result);
  }
  
  return result;
};

const removePseudoSelectors = (selector) => {
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

const processCSSRule = ($, filename, unusedCSSRules) => (rule) => {
  if (rule.type === "media") {
    rule.rules.forEach(processCSSRule($, filename, unusedCSSRules));
    return;
  }

  if (rule.type !== "rule") return;

  
  rule.selectors.forEach(selector => {
    if (selectorsToSkip.find(skip => selector.indexOf(skip) > -1)) {
      // console.log('skipping', selector);
      return;
    } else {
      // console.log('checking', selector);
    }
    const normalizedSelector = removePseudoSelectors(selector);
    if ($(normalizedSelector).length > 0) return;

    const sourceFile = findSourceFileForRule(selector) || filename;
    unusedCSSRules.push({ selector, rule, sourceFile });
  });
};

module.exports = async ({ origin, headers = {}, cache = false, cssFilePaths = [] }) => {
  if (!origin) throw new Error("origin is required");

  if (!cssFilePaths.length) throw new Error("cssFilePaths is required");

  console.log("Crawling HTML on site...", origin);

  const css = await loadCSSFiles(cssFilePaths);
  const html = await loadHTMLViews();
  
  const HTML = `<html><body>${html} ${ await crawlSite({ origin, headers, cache }) } </body></html>`;

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
    cssFilePaths: [
      join(blot_directory, 'app/documentation/data/documentation.min.css')
    ]
  });
}