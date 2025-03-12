const cheerio = require("cheerio");
const { resolve, parse } = require("url");
const clfdate = require("helper/clfdate");

const log = (...args) => console.log(clfdate(), "Broken:", ...args);

async function checkLinks(_fetch, url, options = {}) {
  // check the type of the first argument
  if (typeof _fetch !== "function") {
    throw new Error("The first argument must be a function");
  }

  // check the type of the second argument
  if (typeof url !== "string") {
    throw new Error("The second argument must be a string");
  }

  // check the type of the third argument
  if (typeof options !== "object") {
    throw new Error("The third argument must be an object");
  }

  const state = {
    checked: new Set(),
    results: {},
    failures: new Map(),
    skipped: new Set(),
  };

  try {
    await checkPage(null, url, options, state, _fetch);
  } catch (error) {
    throw error;
  }

  // If there are no broken links, the results should be an empty object.
  const brokenLinks = [];
  for (const page in state.results) {
    for (const link in state.results[page]) {
      brokenLinks.push({
        page,
        link,
        status: state.results[page][link],
      });
    }
  }

  // sort the broken links by page
  brokenLinks.sort((a, b) => {
    if (a.page < b.page) return -1;
    if (a.page > b.page) return 1;
    return 0;
  });

  if (brokenLinks.length > 0) {
    let errorMessage = "Broken links found:\n";
    brokenLinks.forEach(({ page, link, status }) => {
      errorMessage += `From: ${page}\n  To: ${link}\n      ${status}\n\n`;
    });
    throw new Error(errorMessage);
  }

  return null;
}

function addFailure(base, url, statusCode, state) {
  const basePath = base ? parse(base).pathname : "undefined";
  const pathname = url ? parse(url).pathname : "undefined";
  state.failures.set(pathname, statusCode);
  state.results[basePath] = state.results[basePath] || {};
  state.results[basePath][parse(url).pathname] = statusCode;
}

async function checkPage(base, url, options, state, _fetch) {
  const pathname = parse(url).pathname;

  if (state.failures.has(pathname)) {
    addFailure(base, url, state.failures.get(pathname), state);
    return;
  }

  if (state.checked.has(pathname)) return;

  state.checked.add(pathname);

  const uri = { url, headers: options.headers || {} };

  let res;
  try {
    res = await _fetch(uri.url, { headers: uri.headers });
  } catch (err) {
    log("Error", err.message);
    addFailure(base, url, err.code || "Network Error", state);
    return;
  }

  if (res.status !== 200 && res.status !== 400) {
    addFailure(base, url, res.status, state);
  }

  if (
    !res.headers.get("content-type") ||
    !res.headers.get("content-type").includes("text/html")
  ) {
    return;
  }

  const body = await res.text();
  await parseURLs(url, body, options, state, _fetch);
}

async function parseURLs(base, body, options, state, _fetch) {
  let $;
  try {
    $ = cheerio.load(body);
  } catch (e) {
    throw new Error(`Failed to parse HTML: ${e.message}`);
  }

  const URLs = $("[href], [src]")
    .map((_, el) => $(el).attr("href") || $(el).attr("src"))
    .get()
    .filter((url) => url)
    .map((url) => resolve(base, url))
    .filter((url) => {
      if (state.skipped.has(url) || parse(url).host !== parse(base).host) {
        // if (!state.skipped.has(url)) log("skipping", url);
        state.skipped.add(url);
        return false;
      }
      return true;
    });

  await Promise.all(URLs.map((url) => checkPage(base, url, options, state, _fetch)));
}

module.exports = checkLinks;
