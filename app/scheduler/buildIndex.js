// Recursively checks a URL for broken internal links. Will check
// the href= and src= attributes of any elements in the HTML response.

// I tried to use a third-party library for this at first but couldn't
// find anything which allowed custom HTTP readers with each request.
// This feature is neccessary to check the dashboard, with authentication.

// Calls back with an array of broken links in this format:
// [{
//   url:  the broken link's value, e.g. https://blot.im/XXX
//   base: the page on which the broken link was found
//   status: the HTTP status code returned for the broken link
// }]

const { host, protocol, postgres, cache_directory } = require("config");
const Cache = require("helper/express-disk-cache");
const cache = new Cache(cache_directory);
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const clfdate = require("helper/clfdate");
const { parse, resolve } = require("url");

const https = require("https");
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

const Pool = require("pg").Pool;
const pool = new Pool({
  user: postgres.user,
  host: postgres.host,
  database: postgres.database,
  password: postgres.password,
  port: postgres.port,
});

function main() {
  // Empty any existing responses
  cache.flush({ host }, async function (err) {
    if (err) console.warn(err);

    console.log(clfdate(), "Building search index for documentation");
    try {
      const pages = await checkPage(protocol + host);

      if (require.main === module) {
        console.log(clfdate(), "Building search index:", pages);
      }

      await pool.query(`DELETE FROM documentation;`);

      for (const { url, content, title, tags } of pages) {
        await pool.query(
          `INSERT INTO documentation(url, content, title, tags)
          VALUES($1, $2, $3, $4)
          ON CONFLICT (url)
          DO UPDATE SET
            content = EXCLUDED.content,
            title = EXCLUDED.title,
            tags = EXCLUDED.tags`,
          [url, content, title, tags]
        );
      }
    } catch (err) {
      return console.warn(
        clfdate(),
        "Building search index error:",
        err.message
      );
    }

    console.log(clfdate(), "Built search index for documentation");
  });
}

async function checkPage(base, checked = {}, pages = []) {
  checked[base] = true;

  const response = await fetch(base, { agent: httpsAgent });
  const type = response.headers.get("content-type");

  checked[response.url] = true;

  console.log(clfdate(), "Parsing", response.url);

  if (!type || !type.includes("text/html")) {
    return;
  }

  const body = await response.text();
  const $ = cheerio.load(body);
  const urls = parseURLs(response.url, $);

  const content = $("p").text().split("\n").join(" ");
  const title = $("h1").first() ? $("h1").first().text() : $("title").text();

  if (!title) {
    console.error("ERROR: failed to find title", response.url);
  }

  const tags = parse(response.url)
    .pathname.split("/")
    .filter((i) => !!i)
    .join(", ");

  const pathname = parse(response.url).pathname;

  if (!pages.find((i) => i.url === pathname))
    pages.push({
      url: pathname,
      content,
      title,
      tags,
    });

  for (const url of urls) {
    if (checked[url]) continue;
    await checkPage(url, checked, pages);
  }

  return pages;
}

function parseURLs(base, $) {
  const urls = [];

  $("[href],[src]").each(function () {
    let link = $(this).attr("href") || $(this).attr("src");

    // Internal link
    if (link.startsWith('#')) return;

    // Nothing linked
    if (!link) return;

    // Link to a fragment on another pagge
    if (link.includes("#")) link = link.slice(0, link.indexOf("#"));

    // We don't index these links
    if (link.startsWith("/questions") || link.startsWith("/dashboard")) return;

    if (
      link.endsWith(".zip") ||
      link.endsWith(".js") ||
      link.endsWith(".css") ||
      link.endsWith(".png") ||
      link.endsWith(".svg")
    )
      return;

    const url = resolve(base, link);

    if (parse(url).host !== host) return;

    if (!urls.includes(url)) urls.push(url);
  });

  return urls;
}

if (require.main === module) {
  main();
}

module.exports = main;
