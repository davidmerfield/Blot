const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { resolve, parse } = require("url");
const clfdate = require("helper/clfdate");

const log = (...args) => console.log(clfdate(), "Broken:", ...args);

async function checkLinks(url, options = {}) {
  const state = {
    checked: new Set(),
    results: {},
    failures: new Map(),
    skipped: new Set(),
  };

  try {
    await checkPage(null, url, options, state);
    return state.results;
  } catch (error) {
    throw error;
  }
}

function addFailure(base, url, statusCode, state) {
  const basePath = base ? parse(base).pathname : "undefined";
  const pathname = url ? parse(url).pathname : "undefined";
  state.failures.set(pathname, statusCode);
  state.results[basePath] = state.results[basePath] || {};
  state.results[basePath][parse(url).pathname] = statusCode;
}

async function checkPage(base, url, options, state) {
  const pathname = parse(url).pathname;

  if (state.failures.has(pathname)) {
    addFailure(base, url, state.failures.get(pathname), state);
    return;
  }

  if (state.checked.has(pathname)) return;

  state.checked.add(pathname);

  const uri = { url, headers: options.headers || {} };

  log("GET", url);

  let res;
  try {
    res = await fetch(uri.url, { headers: uri.headers });
  } catch (err) {
    log("Error", err.message);
    addFailure(base, url, err.code || "Network Error", state);
    return;
  }

  log("GOT", url, res.status);

  if (res.status !== 200 && res.status !== 400) {
    addFailure(base, url, res.status, state);
  }

  if (!res.headers.get("content-type") || !res.headers.get("content-type").includes("text/html")) {
    return;
  }

  const body = await res.text();
  await parseURLs(url, body, options, state);
}

async function parseURLs(base, body, options, state) {
  let $;
  try {
    $ = cheerio.load(body);
  } catch (e) {
    throw new Error(`Failed to parse HTML: ${e.message}`);
  }

  const URLs = $("[href], [src]")
    .map((_, el) => $(el).attr("href") || $(el).attr("src"))
    .get()
    .filter(url => url)
    .map(url => resolve(base, url))
    .filter(url => {
      if (state.skipped.has(url) || parse(url).host !== parse(base).host) {
        if (!state.skipped.has(url)) log("skipping", url);
        state.skipped.add(url);
        return false;
      }
      return true;
    });

  await Promise.all(URLs.map(url => checkPage(base, url, options, state)));
}

module.exports = checkLinks;