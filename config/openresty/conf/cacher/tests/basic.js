const fs = require("fs-extra");
const fetch = require("node-fetch");
const setup = require("./util/setup");

describe("cacher", function () {
  setup("./basic.conf");

  it("caches a request", async function () {
    const response = await fetch(this.origin);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Status")).toBe("MISS");
    expect(text).toBe("Hello Node!");

    const files = await this.listCache();

    expect(files.length).toBe(1);

    const contents = await fs.readFile(files[0], "utf-8");
    // we trim because the lines end with '\r'
    const lines = contents.split("\n").map(l => l.trim());

    expect(lines.length).toBe(11);
    expect(lines[1]).toBe("KEY: " + this.origin + "/");
    expect(lines[2]).toBe("HTTP/1.1 200 OK");
    expect(lines[3]).toBe("X-Powered-By: Express");
    expect(lines[4]).toBe("Content-Type: text/html; charset=utf-8");
    expect(lines[5]).toBe("Content-Length: 11");
    expect(lines[6]).toMatch(/^ETag: /);
    expect(lines[7]).toMatch(/^Date: /);
    expect(lines[8]).toBe("Connection: close");
    expect(lines[10]).toBe("Hello Node!");

    // if we retry the request, the header 'cache-hit' should be set
    const cachedResponse = await fetch(this.origin);
    const cachedText = await cachedResponse.text();
    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.headers.get("Cache-Status")).toBe("HIT");
    expect(cachedText).toBe(text);
  });

  it("purges a cached request", async function () {
    const response = await fetch(this.origin);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Status")).toBe("MISS");
    const cachedResponse = await fetch(this.origin);
    const cachedText = await cachedResponse.text();
    expect(cachedResponse.status).toBe(200);
    expect(cachedResponse.headers.get("Cache-Status")).toBe("HIT");
    expect(cachedText).toBe(text);
    // use a request to origin/purge with method PURGE and query host '127.0.0.1' to purge the cache
    await fetch(this.origin + "/purge?host=127.0.0.1");
    const purgedResponse = await fetch(this.origin);
    const purgedText = await purgedResponse.text();
    expect(purgedResponse.status).toBe(200);
    expect(purgedResponse.headers.get("Cache-Status")).toBe("MISS");
    expect(purgedText).toBe(text);
  });

  it("purges a cached request even after restarting openresty", async function () {
    const response = await fetch(this.origin);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Status")).toBe("MISS");

    await this.restartOpenresty();

    expect((await this.listCache()).length).toEqual(1);

    await fetch(this.origin + "/purge?host=127.0.0.1");

    expect(await this.listCache({ watch: false })).toEqual([]);
  });
});
