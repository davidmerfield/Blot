const http = require("http");
const fetch = require("../util/rateLimitedFetchWithRetriesAndTimeout");

describe("icloud rateLimitedFetchWithRetriesAndTimeout", function () {
  let server;
  let url;
  let requests;
  let stallFirst;

  beforeEach(async function () {
    requests = 0;
    stallFirst = 0;
    server = http.createServer((req, res) => {
      requests++;
      res.setHeader("Content-Length", "5");
      res.writeHead(200);
      if (requests <= stallFirst) {
        // send headers and part of the body, then never finish
        res.write("he");
        return;
      }
      res.end("hello");
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    url = `http://127.0.0.1:${server.address().port}/`;
    spyOn(console, "error");
  });

  afterEach(function (done) {
    server.closeAllConnections();
    server.close(() => done());
  });

  it("resolves to the body as a Buffer with readBody", async function () {
    const body = await fetch(url, { readBody: true });
    expect(Buffer.isBuffer(body)).toBe(true);
    expect(body.toString()).toBe("hello");
  });

  it("retries when the body stalls after the headers arrive", async function () {
    stallFirst = 1;
    const body = await fetch(url, { readBody: true, timeout: 200 });
    expect(body.toString()).toBe("hello");
    expect(requests).toBe(2);
  });

  it("fails after the retries if the body always stalls", async function () {
    stallFirst = Infinity;
    let error;
    try {
      await fetch(url, { readBody: true, timeout: 100, retries: 2 });
    } catch (e) {
      error = e;
    }
    expect(error).toBeDefined();
    expect(requests).toBe(2);
  });
});
