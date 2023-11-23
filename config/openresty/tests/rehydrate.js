const fs = require("fs-extra");
const fetch = require("node-fetch");
const setup = require("./util/setup");

describe("cacher", function () {
  setup("./rehydrate.conf");

  it(
    "inspects stored requests",
    async function () {
      const number_of_requests = 100;

      for (let i = 0; i < number_of_requests; i++) {
        const res = await fetch(this.origin + "/timestamp/" + i);
        const text = await res.text();
        expect(res.status).toBe(200);
        expect(parseInt(text)).toBeGreaterThan(0);
        expect(res.headers.get("Cache-Status")).toBe("MISS");
      }

      const rehydrateResponse = await fetch(this.origin + "/rehydrate");
      const rehydrateText = await rehydrateResponse.text();

      expect(rehydrateText.trim()).toEqual("OK");

      const files = await this.listCache();

      expect(files.length).toBe(number_of_requests);

      const inspectResponse = await fetch(
        this.origin + "/inspect?host=127.0.0.1"
      );
      const inspectText = await inspectResponse.text();

      expect(inspectText.trim().split("\n").sort()).toEqual(
        files.map(path => path.split("/").pop()).sort()
      );

      // checks for mismatches
      expect(await this.inspectCache()).toEqual("");
    },
    1000 * 60 * 5
  );
});
