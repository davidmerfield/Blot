const fs = require("fs-extra");

describe("express-disk-cache.flush", function () {
  it("flushes a subdirectory", async function (done) {
    const Cache = require("../index");
    const cache = Cache(__dirname + "/data");

    await fs.outputFile(
      __dirname + "/data/example.com/foo/bar.html",
      "Hello",
      "utf-8"
    );

    // Hides dotfiles (and system files)
    const readdir = async (dir) =>
      (await fs.readdir(dir)).filter((i) => !i.startsWith("."));

    cache.flush({ host: "example.com", path: '/foo' }, async function (err) {
      if (err) return done.fail(err);
      expect(await readdir(__dirname + "/data/")).toEqual(["example.com"]);
      expect(await readdir(__dirname + "/data/example.com")).toEqual(['foo']);
      expect(await readdir(__dirname + "/data/example.com/foo")).toEqual([]);
      done();
    });
  });

  it("will can flush the cache directory", async function (done) {
    const Cache = require("../index");
    const cache = Cache(__dirname + "/data");

    await fs.outputFile(
      __dirname + "/data/example.com/test.html",
      "Hello",
      "utf-8"
    );

    // Hides dotfiles (and system files)
    const readdir = async (dir) =>
      (await fs.readdir(dir)).filter((i) => !i.startsWith("."));

    cache.flush({ host: "example.com" }, async function (err) {
      if (err) return done.fail(err);
      expect(await readdir(__dirname + "/data/")).toEqual(["example.com"]);
      expect(await readdir(__dirname + "/data/example.com")).toEqual([]);
      done();
    });
  });

  require("./setup")();
});
