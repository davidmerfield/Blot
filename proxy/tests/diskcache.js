const http = require("http");
const crypto = require("crypto");
const zlib = require("zlib");
const fs = require("fs-extra");
const { join } = require("path");
const setup = require("./util/setup");

// diskcache.lua is the prototype replacement for nginx's proxy_cache (the
// disk_cache build flag). diskcache.conf mirrors its production wiring.

const md5 = (string) => crypto.createHash("md5").update(string).digest("hex");

const html = (n) => "<p>" + "hello disk cache. ".repeat(n) + "</p>";

// The upstream is plain http, not the express stub, so a spec can cut a
// response short or delay it. Every request is counted by path.
let hits;
let delay;

const upstream = ({ port }) =>
  new Promise((resolve) => {
    hits = {};
    delay = {};

    const server = http.createServer((req, res) => {
      const url = new URL(req.url, "http://upstream");
      const path = url.pathname;
      hits[path] = (hits[path] || 0) + 1;

      const respond = () => {
        if (path === "/redirect") {
          res.writeHead(301, { Location: "/target", "Content-Type": "text/html" });
          return res.end("moved");
        }

        if (path === "/missing") {
          res.writeHead(404, { "Content-Type": "text/html" });
          return res.end("<p>nothing here</p>");
        }

        if (path === "/error") {
          res.writeHead(500, { "Content-Type": "text/html" });
          return res.end("<p>broken</p>");
        }

        if (path === "/big") {
          const body = bigBody();
          res.writeHead(200, { "Content-Type": "application/octet-stream" });
          return res.end(body);
        }

        if (path === "/truncated") {
          res.writeHead(200, { "Content-Type": "text/html", "Content-Length": 1000 });
          res.write("x".repeat(400));
          return setTimeout(() => res.socket.destroy(), 50);
        }

        if (path === "/photo.jpg") {
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          return res.end(Buffer.alloc(2000, 7));
        }

        if (path === "/page") {
          res.writeHead(200, {
            "Content-Type": "text/html; charset=utf-8",
            "X-Custom": "kept",
            "Set-Cookie": "session=secret; Path=/",
          });
          return res.end(html(100));
        }

        if (path.startsWith("/article-")) {
          res.writeHead(200, { "Content-Type": "text/html" });
          return res.end(html(50) + path);
        }

        if (path === "/small") {
          res.writeHead(200, { "Content-Type": "text/html" });
          return res.end("<p>tiny</p>");
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<p>" + path + "</p>");
      };

      const wait = delay[path];
      if (wait) setTimeout(respond, wait);
      else respond();
    });

    server.listen(port, () => resolve(server));
  });

const bigBody = () => {
  const body = Buffer.alloc(5 * 1024 * 1024);
  for (let i = 0; i < body.length; i++) body[i] = (i * 7 + (i >> 8)) % 251;
  return body;
};

// No decompression and no Accept-Encoding unless asked for, unlike fetch
const request = (origin, path, { host = "example.test", method = "GET", headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const req = http.request(
      origin + path,
      { method, headers: { Host: host, ...headers }, agent: false },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("error", reject);
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(chunks),
          })
        );
        res.on("aborted", () => reject(new Error("response aborted")));
      }
    );
    req.on("error", reject);
    req.end();
  });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const until = async (fn, { timeout = 10000, interval = 50, message = "condition" } = {}) => {
  const deadline = Date.now() + timeout;
  let value;
  while (Date.now() < deadline) {
    value = await fn();
    if (value) return value;
    await sleep(interval);
  }
  throw new Error("timed out waiting for " + message);
};

// Where an entry lives, as the header comment in diskcache.lua describes
const hostDirectory = (cacheDirectory, host) => {
  const hash = md5(host);
  return join(cacheDirectory, hash.slice(-1), hash.slice(-3, -1), host);
};

const entry = (cacheDirectory, host, cacheKey) => {
  const directory = hostDirectory(cacheDirectory, host);
  const key = md5(cacheKey);
  return {
    directory,
    key,
    meta: join(directory, key + ".meta"),
    body: (id) => join(directory, key + "." + id),
  };
};

describe("diskcache", function () {
  setup("./diskcache.conf", { waitForIndex: false, upstream });

  const host = "example.test";

  // The metadata is published last, so once it exists the entry is complete
  const stored = function (path, name = host) {
    const { meta } = entry(this.cache_directory, name, `http://${name}${path}`);
    return until(() => fs.pathExists(meta), { message: "entry for " + path });
  };

  const fill = async function (path, options) {
    const first = await request(this.origin, path, options);
    await stored.call(this, path, options && options.host);
    return first;
  };

  it("serves a MISS then a HIT from the cache, asking the upstream once", async function () {
    const first = await request(this.origin, "/page");
    expect(first.status).toBe(200);
    expect(first.headers["blot-cache"]).toBe("MISS");
    expect(first.body.toString()).toBe(html(100));

    await stored.call(this, "/page");

    const second = await request(this.origin, "/page");
    expect(second.status).toBe(200);
    expect(second.headers["blot-cache"]).toBe("HIT");
    expect(second.body.toString()).toBe(html(100));
    expect(hits["/page"]).toBe(1);
  });

  it("sends the stored headers again on a hit, but not Set-Cookie", async function () {
    const first = await fill.call(this, "/page");
    expect(first.headers["set-cookie"]).toBeDefined();

    const second = await request(this.origin, "/page");
    expect(second.headers["blot-cache"]).toBe("HIT");
    expect(second.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(second.headers["x-custom"]).toBe("kept");
    expect(second.headers["set-cookie"]).toBeUndefined();
    expect(second.headers["content-length"]).toBe(String(Buffer.byteLength(html(100))));
  });

  it("caches a redirect", async function () {
    const first = await fill.call(this, "/redirect");
    expect(first.status).toBe(301);

    const second = await request(this.origin, "/redirect");
    expect(second.status).toBe(301);
    expect(second.headers["blot-cache"]).toBe("HIT");
    expect(second.headers.location).toBe("/target");
    expect(second.body.toString()).toBe("moved");
    expect(hits["/redirect"]).toBe(1);
  });

  it("caches a 404", async function () {
    const first = await fill.call(this, "/missing");
    expect(first.status).toBe(404);

    const second = await request(this.origin, "/missing");
    expect(second.status).toBe(404);
    expect(second.headers["blot-cache"]).toBe("HIT");
    expect(second.headers["content-type"]).toBe("text/html");
    expect(second.body.toString()).toBe("<p>nothing here</p>");
    expect(hits["/missing"]).toBe(1);
  });

  it("does not cache a 500", async function () {
    const first = await request(this.origin, "/error");
    expect(first.status).toBe(500);

    // The 500 is intercepted (error_page), and the internal redirect drops
    // ngx.ctx, so the fill lock is released from the inherited log_by_lua
    // (diskcache:release). Without that this request waits out LOCK_TIMEOUT.
    const started = Date.now();
    const second = await request(this.origin, "/error");
    expect(Date.now() - started).toBeLessThan(2000);
    expect(second.status).toBe(500);
    expect(second.headers["blot-cache"]).not.toBe("HIT");
    expect(hits["/error"]).toBe(2);
  }, 30000);

  it("does not store a HEAD miss, and answers a HEAD hit without a body", async function () {
    const head = await request(this.origin, "/page", { method: "HEAD" });
    expect(head.status).toBe(200);
    expect(head.headers["blot-cache"]).toBe("MISS");
    expect(head.body.length).toBe(0);

    await sleep(300);
    const { meta } = entry(this.cache_directory, host, `http://${host}/page`);
    expect(await fs.pathExists(meta)).toBe(false);

    const get = await fill.call(this, "/page");
    expect(get.headers["blot-cache"]).toBe("MISS");
    expect(hits["/page"]).toBe(2);

    const cachedHead = await request(this.origin, "/page", { method: "HEAD" });
    expect(cachedHead.status).toBe(200);
    expect(cachedHead.headers["blot-cache"]).toBe("HIT");
    expect(cachedHead.body.length).toBe(0);
    expect(cachedHead.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(hits["/page"]).toBe(2);
  });

  it("stores a large body completely", async function () {
    const expected = bigBody();

    const first = await fill.call(this, "/big");
    expect(first.headers["blot-cache"]).toBe("MISS");
    expect(first.body.equals(expected)).toBe(true);

    const second = await request(this.origin, "/big");
    expect(second.headers["blot-cache"]).toBe("HIT");
    expect(second.body.length).toBe(expected.length);
    expect(second.body.equals(expected)).toBe(true);
    expect(hits["/big"]).toBe(1);
  });

  it("does not store a body cut short before its Content-Length", async function () {
    await request(this.origin, "/truncated").catch(() => {});
    await sleep(500);

    const { meta, directory } = entry(this.cache_directory, host, `http://${host}/truncated`);
    expect(await fs.pathExists(meta)).toBe(false);

    // nothing published and nothing left behind in .tmp
    const files = (await fs.pathExists(directory)) ? await fs.readdir(directory) : [];
    expect(files.filter((name) => name !== ".tmp")).toEqual([]);
    const tmp = (await fs.pathExists(directory + "/.tmp")) ? await fs.readdir(directory + "/.tmp") : [];
    expect(tmp).toEqual([]);

    await request(this.origin, "/truncated").catch(() => {});
    expect(hits["/truncated"]).toBe(2);
  });

  describe("compressed copies", function () {
    const withEncoding = (value) => ({ headers: { "Accept-Encoding": value } });

    for (const [encoding, name, decode] of [
      ["br", "br", zlib.brotliDecompressSync],
      ["gzip", "gzip", zlib.gunzipSync],
    ]) {
      it("serves a " + name + " copy once it is made", async function () {
        await fill.call(this, "/page");

        // until then the gzip filter compresses on the fly, which is not
        // what this checks
        await until(async () => {
          const dir = entry(this.cache_directory, host, `http://${host}/page`).directory;
          return (await fs.readdir(dir)).some((file) => file.endsWith(encoding === "br" ? ".br" : ".gz"));
        }, { message: encoding + " copy on disk" });

        const response = await until(
          async () => {
            const r = await request(this.origin, "/page", withEncoding(encoding));
            return r.headers["content-encoding"] === encoding && r;
          },
          { message: encoding + " copy" }
        );

        expect(response.status).toBe(200);
        expect(response.headers["blot-cache"]).toBe("HIT");
        expect(response.headers["content-type"]).toBe("text/html; charset=utf-8");
        expect(response.headers.vary).toMatch(/Accept-Encoding/i);
        expect(decode(response.body).toString()).toBe(html(100));
        expect(response.body.length).toBeLessThan(Buffer.byteLength(html(100)));
        expect(hits["/page"]).toBe(1);
      });
    }

    it("serves the plain body when the client accepts no encoding", async function () {
      await fill.call(this, "/page");
      await until(async () => {
        const dir = entry(this.cache_directory, host, `http://${host}/page`).directory;
        return (await fs.readdir(dir)).filter((name) => /\.(br|gz)$/.test(name)).length === 2;
      }, { message: "both copies" });

      const response = await request(this.origin, "/page");
      expect(response.headers["blot-cache"]).toBe("HIT");
      expect(response.headers["content-encoding"]).toBeUndefined();
      expect(response.body.toString()).toBe(html(100));
    });

    it("compresses every entry when more are filled than compressors run at once", async function () {
      const paths = Array.from({ length: 8 }, (_, i) => "/article-" + i);

      await Promise.all(paths.map((path) => fill.call(this, path)));

      for (const path of paths) {
        const response = await until(
          async () => {
            const r = await request(this.origin, path, withEncoding("br"));
            return r.headers["content-encoding"] === "br" && r;
          },
          { message: "br copy of " + path, timeout: 20000 }
        );

        expect(zlib.brotliDecompressSync(response.body).toString()).toBe(html(50) + path);
      }
    }, 30000);

    it("records that a small body or an image has no copies to make", async function () {
      await fill.call(this, "/photo.jpg");

      const { directory, key } = entry(this.cache_directory, host, `http://${host}/photo.jpg`);
      const meta = JSON.parse(await fs.readFile(join(directory, key + ".meta"), "utf8"));
      expect(meta.v).toEqual({});

      const response = await request(this.origin, "/photo.jpg", withEncoding("br, gzip"));
      expect(response.headers.vary).toBeUndefined();
    });

    it("does not compress a small body or an image", async function () {
      await fill.call(this, "/small");
      await fill.call(this, "/photo.jpg");

      // long enough for a compression to have finished
      await sleep(1500);

      for (const path of ["/small", "/photo.jpg"]) {
        const dir = entry(this.cache_directory, host, `http://${host}${path}`).directory;
        const copies = (await fs.readdir(dir)).filter((name) => /\.(br|gz)$/.test(name));
        expect(copies).toEqual([]);

        const response = await request(this.origin, path, withEncoding("br, gzip"));
        expect(response.headers["blot-cache"]).toBe("HIT");
        expect(response.headers["content-encoding"]).toBeUndefined();
      }
    });
  });

  describe("purge", function () {
    it("makes the next request a MISS and empties the host directory", async function () {
      await fill.call(this, "/page");
      await fill.call(this, "/page", { host: "other.test" });
      const directory = hostDirectory(this.cache_directory, host);
      expect(await fs.pathExists(directory)).toBe(true);

      const purge = await request(this.origin, "/purge?host=" + host);
      expect(purge.status).toBe(200);
      expect(purge.body.toString()).toContain(host + ": purged");

      expect(await fs.pathExists(directory)).toBe(false);

      // the trash is emptied in the background
      await until(
        async () => {
          const trash = this.cache_directory + "/.trash";
          return !(await fs.pathExists(trash)) || (await fs.readdir(trash)).length === 0;
        },
        { message: "trash to be emptied" }
      );

      const after = await request(this.origin, "/page");
      expect(after.headers["blot-cache"]).toBe("MISS");
      expect(hits["/page"]).toBe(3);

      // the other host kept its entry
      const other = await request(this.origin, "/page", { host: "other.test" });
      expect(other.headers["blot-cache"]).toBe("HIT");
      expect(hits["/page"]).toBe(3);
    });

    it("does not publish a fill that was in flight during a purge", async function () {
      // an earlier entry on the host, so its directories exist (as in production)
      await fill.call(this, "/small");

      delay["/slow"] = 500;
      const slow = request(this.origin, "/slow");
      await sleep(150);

      const purge = await request(this.origin, "/purge?host=" + host);
      expect(purge.status).toBe(200);

      const first = await slow;
      expect(first.status).toBe(200);
      expect(first.headers["blot-cache"]).toBe("MISS");
      await sleep(300);

      delay["/slow"] = 0;
      const second = await request(this.origin, "/slow");
      expect(second.headers["blot-cache"]).toBe("MISS");
      expect(hits["/slow"]).toBe(2);
    });

    // The <host>.purged marker must be written even when the host's shard
    // directory does not exist yet, or the in-flight fill is published.
    it("does not publish a fill in flight during a purge when the host had nothing cached", async function () {
      delay["/slow"] = 500;
      const slow = request(this.origin, "/slow");
      await sleep(150);

      await request(this.origin, "/purge?host=" + host);

      await slow;
      await sleep(300);

      delay["/slow"] = 0;
      const second = await request(this.origin, "/slow");
      expect(second.headers["blot-cache"]).toBe("MISS");
      expect(hits["/slow"]).toBe(2);
    });
  });

  it("fills once for concurrent misses of one key", async function () {
    delay["/page"] = 300;

    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request(this.origin, "/page"))
    );

    expect(hits["/page"]).toBe(1);

    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.toString()).toBe(html(100));
    }

    expect(responses.filter((r) => r.headers["blot-cache"] === "MISS").length).toBe(1);
  });

  it("lays entries out as the header comment of diskcache.lua says", async function () {
    await fill.call(this, "/page");

    const hash = md5(host);
    const directory = join(this.cache_directory, hash.slice(-1), hash.slice(-3, -1), host);
    const key = md5(`http://${host}/page`);

    const meta = JSON.parse(await fs.readFile(join(directory, key + ".meta"), "utf8"));

    expect(Object.keys(meta).sort()).toEqual(
      ["h", "id", "k", "s", "t"].concat(meta.v ? ["v"] : []).sort()
    );
    expect(meta.s).toBe(200);
    expect(meta.k).toBe(`http://${host}/page`);
    expect(typeof meta.id).toBe("string");
    expect(typeof meta.t).toBe("number");
    expect(Math.abs(meta.t - Date.now() / 1000)).toBeLessThan(60);
    expect(meta.h).toContain(["X-Custom", "kept"]);
    expect(meta.h.find(([name]) => name.toLowerCase() === "set-cookie")).toBeUndefined();

    expect(await fs.readFile(join(directory, key + "." + meta.id), "utf8")).toBe(html(100));
    expect(await fs.pathExists(directory + "/.tmp")).toBe(true);
  });
});
