const fs = require("fs-extra");
const fetch = require("node-fetch");
const setup = require("./util/setup");

describe("cacher", function () {
  setup("./lru_purge.conf");

  it(
    "will automatically purge the cache when it fills up",
    async function () {
      const number_of_requests = 10000;

      for (let i = 0; i < number_of_requests; i++) {
        const res = await fetch(
          this.origin + "/timestamp/" + i + "?host=" + randomhost()
        );
        const text = await res.text();
        expect(res.status).toBe(200);
        expect(parseInt(text)).toBeGreaterThan(0);
        expect(res.headers.get("Cache-Status")).toBe("MISS");
      }

      // check that none of the files on disk are untracked by openresty shared dict
      expect(await this.inspectCache()).toEqual("");
    },
    2 * 60 * 1000 // 2 minutes
  );
});

const letters = "abcdef";
const host_length = 5;

// will generate one of 7776 possible hosts
// e.g. aaaaa.com, aaaab.com, aaaac.com, etc.
function randomhost () {
  let host = "";
  for (let i = 0; i < host_length; i++) {
    host += letters[Math.floor(Math.random() * letters.length)];
  }
  host += ".com";
  return host;
}
