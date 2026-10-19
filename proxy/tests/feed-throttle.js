const fetch = require("node-fetch");
const setup = require("./util/setup");

// The throttle exempts loopback, so each request claims a client address via
// X-Test-IP (set_real_ip_from in feed-throttle.conf).
describe("feed throttle", function () {
  setup("./feed-throttle.conf");

  const get = (origin, path, ip, headers = {}, method = "GET") =>
    fetch(origin + path, {
      method,
      headers: { "X-Test-IP": ip, ...headers }
    });

  it("refuses a second unconditional feed request with 429 and Retry-After", async function () {
    const first = await get(this.origin, "/feed.rss", "198.51.100.1");
    expect(first.status).not.toBe(429);

    const second = await get(this.origin, "/feed.rss?x=1", "198.51.100.1");
    expect(second.status).toBe(429);
    const retry = Number(second.headers.get("Retry-After"));
    expect(retry).toBeGreaterThan(890);
    expect(retry).toBeLessThanOrEqual(900);
    expect(await second.text()).toContain("Too many requests");
  });

  it("does not throttle non-feed paths", async function () {
    await get(this.origin, "/", "198.51.100.2");
    const again = await get(this.origin, "/", "198.51.100.2");
    expect(again.status).toBe(200);
  });

  it("passes conditional requests", async function () {
    await get(this.origin, "/feed.rss", "198.51.100.3");
    const inm = await get(this.origin, "/feed.rss", "198.51.100.3", {
      "If-None-Match": '"abc"'
    });
    expect(inm.status).not.toBe(429);
    const ims = await get(this.origin, "/feed.rss", "198.51.100.3", {
      "If-Modified-Since": "Wed, 21 Oct 2015 07:28:00 GMT"
    });
    expect(ims.status).not.toBe(429);
  });

  it("keys on IP, host and path", async function () {
    await get(this.origin, "/feed.rss", "198.51.100.4");
    expect((await get(this.origin, "/feed.rss", "198.51.100.5")).status).not.toBe(429);
    expect((await get(this.origin, "/atom.xml", "198.51.100.4")).status).not.toBe(429);
    expect(
      (await get(this.origin, "/feed.rss", "198.51.100.4", { Host: "other.test" })).status
    ).not.toBe(429);
  });

  it("lets HEAD check but not open the window", async function () {
    const head = await get(this.origin, "/rss", "198.51.100.6", {}, "HEAD");
    expect(head.status).not.toBe(429);
    expect((await get(this.origin, "/rss", "198.51.100.6")).status).not.toBe(429);
    expect((await get(this.origin, "/rss", "198.51.100.6", {}, "HEAD")).status).toBe(429);
  });

  it("exempts whitelisted and private addresses", async function () {
    for (const ip of ["203.0.113.99", "10.1.2.3", "192.168.1.5", "172.20.0.1", "::1", "127.0.0.1"]) {
      await get(this.origin, "/feed.rss", ip);
      expect((await get(this.origin, "/feed.rss", ip)).status).not.toBe(429);
    }
  });

  it("does not cache the 429", async function () {
    await get(this.origin, "/feed.xml", "198.51.100.7");
    expect((await get(this.origin, "/feed.xml", "198.51.100.7")).status).toBe(429);
    const other = await get(this.origin, "/feed.xml", "198.51.100.8", {
      "If-None-Match": '"x"'
    });
    expect(other.status).not.toBe(429);
  });
});
