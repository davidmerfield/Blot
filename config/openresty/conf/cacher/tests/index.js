const fs = require("fs-extra");
const child_process = require("child_process");
const fetch = require("node-fetch");
const { list } = require("blessed");

describe("cacher", function () {
  const build = require("./build-config");
  const server = require("./server");

  const config = {
    openresty: {
      port: 8787
    },
    node: {
      port: 8788
    }
  };

  const origin = "http://127.0.0.1:" + config.openresty.port + "/";

  beforeAll(async function () {
    await server({ port: config.node.port });
  });

  beforeEach(async function () {
    await fs.remove(__dirname + "/data");
    const conf = await build(__dirname + "/basic.conf", config);

    try {
      child_process.execSync(__dirname + "/start-openresty.sh " + conf);
    } catch (e) {}

    let connected = false;

    while (!connected) {
      try {
        // this will not be cached
        await fetch(origin + "/health");
        connected = true;
      } catch (e) {}
    }
  });

  it("caches a request", async function () {
    const response = await fetch(origin);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Status")).toBe("MISS");
    expect(text).toBe("Hello Node!");

    // use fs
    // recursively list all the files in the cache directory and any subdirectories of it
    const files = await listCache();

    expect(files.length).toBe(1);

    const contents = await fs.readFile(files[0], "utf-8");
    // we trim because the lines end with '\r'
    const lines = contents.split("\n").map(l => l.trim());

    expect(lines.length).toBe(11);
    expect(lines[1]).toBe("KEY: " + origin);
    expect(lines[2]).toBe("HTTP/1.1 200 OK");
    expect(lines[3]).toBe("X-Powered-By: Express");
    expect(lines[4]).toBe("Content-Type: text/html; charset=utf-8");
    expect(lines[5]).toBe("Content-Length: 11");
    expect(lines[6]).toMatch(/^ETag: /);
    expect(lines[7]).toMatch(/^Date: /);
    expect(lines[8]).toBe("Connection: close");
    expect(lines[10]).toBe("Hello Node!");

    // if we retry the request, the header 'cache-hit' should be set
    const cachedResponse = await fetch(origin);
    const cachedText = await cachedResponse.text();
    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.headers.get("Cache-Status")).toBe("HIT");
    expect(cachedText).toBe(text);
  });

  it("purges a cached request", async function () {
    const response = await fetch(origin);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Status")).toBe("MISS");
    const cachedResponse = await fetch(origin);
    const cachedText = await cachedResponse.text();
    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.headers.get("Cache-Status")).toBe("HIT");
    expect(cachedText).toBe(text);
    // use a request to origin/purge with method PURGE and query host '127.0.0.1' to purge the cache
    await fetch(origin + "purge?host=127.0.0.1", { method: "PURGE" });
    const purgedResponse = await fetch(origin);
    const purgedText = await purgedResponse.text();
    expect(purgedResponse.status).toBe(200);
    expect(purgedResponse.headers.get("Cache-Status")).toBe("MISS");
    expect(purgedText).toBe(text);
  });
});

async function listCache () {
  const files = [];
  const cache_directory = __dirname + "/data/cache-basic";

  const list = async function (dir) {
    const stat = await fs.stat(dir);
    if (stat.isDirectory()) {
      const children = await fs.readdir(dir);
      for (const child of children) {
        await list(dir + "/" + child);
      }
    } else {
      files.push(dir);
    }
  };

  // wait for the cache to be populated
  while (files.length === 0) {
    await list(cache_directory);
  }

  return files;
}
