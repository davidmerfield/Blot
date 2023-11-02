const fs = require("fs-extra");
const fetch = require("node-fetch");
const setup = require("./util/setup");
const zlib = require("zlib");

describe("cacher handles gzip", function () {
  setup("./gzip.conf");

  it("caches a request gzipped by upstream", async function () {
    const response = await fetch(this.origin + "/gzip-by-upstream");

    // verify the response is gziped and has the size we expect
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Encoding")).toBe("gzip");
    expect(response.headers.get("Cache-Status")).toBe("MISS");

    const contents = await fs.readFile((await this.listCache())[0], "utf-8");
    // we trim because the lines end with '\r'
    const lines = contents.split("\n").map(l => l.trim());

    expect(lines.length).toBe(13);
    expect(lines[1]).toBe("KEY: " + this.origin + "/gzip-by-upstream");
    expect(lines[2]).toBe("HTTP/1.1 200 OK");
    expect(lines[3]).toBe("X-Powered-By: Express");
    expect(lines[4]).toBe("Content-Type: text/html; charset=utf-8");
    expect(lines[5]).toMatch(/^ETag: /);
    expect(lines[6]).toBe("Vary: Accept-Encoding");
    expect(lines[7]).toBe("Content-Encoding: gzip");
    expect(lines[8]).toMatch(/^Date: /);
    expect(lines[9]).toBe("Connection: close");
    expect(lines[10]).toBe("Transfer-Encoding: chunked");

    // the contents are compressed
    expect(lines[12]).toContain("\x00");
    expect(lines[12]).not.toBe("abc ".repeat(1024).trim());
  });

  it("caches a request gzipped by openresty", async function () {
    const response = await fetch(this.origin + "/gzip-by-openresty");

    // verify the response is gziped and has the size we expect
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Encoding")).toBe("gzip");
    expect(response.headers.get("Cache-Status")).toBe("MISS");

    const contents = await fs.readFile((await this.listCache())[0], "utf-8");
    // we trim because the lines end with '\r'
    const lines = contents.split("\n").map(l => l.trim());

    expect(lines.length).toBe(11);
    expect(lines[1]).toBe("KEY: " + this.origin + "/gzip-by-openresty");
    expect(lines[2]).toBe("HTTP/1.1 200 OK");
    expect(lines[3]).toBe("X-Powered-By: Express");
    expect(lines[4]).toBe("Content-Type: text/html; charset=utf-8");
    expect(lines[5]).toBe("Content-Length: 4096");
    expect(lines[6]).toMatch(/^ETag: /);
    expect(lines[7]).toMatch(/^Date: /);
    expect(lines[8]).toBe("Connection: close");

    // the contents are not compressed
    expect(lines[10]).toBe("abc ".repeat(1024).trim());
  });
});
