const fs = require("fs-extra");

describe("express-disk-cache", function () {
  it("will error if you do not pass a cache directory", async function () {
    expect(function () {
      const cache = require("../index");
      cache();
    }).toThrow();
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

    cache.flush("example.com", async function (err) {
      expect(await readdir(__dirname + "/data/")).toEqual(["example.com"]);
      expect(await readdir(__dirname + "/data/example.com")).toEqual([]);
      done();
    });
  });

  it("works", async function () {
    const { app, listen, fetch, readFile, configure } = this;

    configure();

    app.get("/", (req, res) => res.send("Hello, world!"));

    await listen();

    expect(await fetch("/")).toEqual(`Hello, world!`);

    await delay();

    expect(await readFile("/localhost/http/temporary/index.html")).toEqual(
      "Hello, world!"
    );
  });

  it("gzips HTML", async function () {
    const { app, listen, fetch, readFile, configure } = this;

    configure({ gzip: true });

    app.get("/", (req, res) => res.send("<h1>Hello, world!</h1>"));

    await listen();

    expect(await fetch("/")).toEqual(`<h1>Hello, world!</h1>`);

    await delay();
    const { gunzipSync } = require("zlib");

    expect(
      gunzipSync(
        await readFile("/localhost/http/temporary/index.html.gz", null)
      ).toString()
    ).toEqual("<h1>Hello, world!</h1>");
  });

  it("minifies HTML", async function () {
    const { app, listen, fetch, readFile, configure } = this;

    configure({ minify: true });

    app.get("/", (req, res) => res.send("<h1  >Hello, world!</h1>"));

    await listen();

    expect(await fetch("/")).toEqual(`<h1  >Hello, world!</h1>`);

    await delay();

    expect(await readFile("/localhost/http/temporary/index.html")).toEqual(
      "<h1>Hello, world!</h1>"
    );
  });

  it("minifies CSS", async function () {
    const { app, listen, fetch, readFile, configure } = this;

    configure({ minify: true });

    app.get("/file.css", (req, res) => res.send(".hey  {color:#000000}"));

    await listen();

    expect(await fetch("/file.css")).toEqual(`.hey  {color:#000000}`);

    await delay();

    expect(await readFile("/localhost/http/temporary/file.css")).toEqual(
      ".hey {color:#000000}"
    );
  });

  it("minifies JS", async function () {
    const { app, listen, fetch, readFile, configure } = this;

    configure({ minify: true });

    app.get("/script.js", (req, res) => res.send(" \n alert( 'Hey' + 1 ) \n"));

    await listen();

    expect(await fetch("/script.js")).toEqual(" \n alert( 'Hey' + 1 ) \n");

    await delay();

    expect(await readFile("/localhost/http/temporary/script.js")).toEqual(
      "alert( 'Hey' + 1 )"
    );
  });

  beforeEach(async function () {
    const fetch = require("node-fetch");
    const { join } = require("path");
    const port = 7766;
    const express = require("express");
    const cache = require("../index");

    const app = express();

    this.cache_directory = __dirname + "/data";

    this.minify = false;
    this.gzip = false;

    this.configure = ({
      directory = this.cache_directory,
      minify = this.minify,
      gzip = this.gzip,
    } = {}) => {
      app.use(cache(directory, { minify, gzip }));
    };

    this.readFile = (path, encoding = "utf-8") =>
      fs.readFile(join(this.cache_directory, path), encoding);

    this.listen = async () => {
      this.server = await app.listen(port);
    };

    this.app = app;

    this.close = async () => (this.server ? await this.server.close() : null);

    this.fetch = async (path) => {
      const res = await fetch(`http://localhost:${port}${path}`);
      return await res.text();
    };
  });

  const delay = async (ms = 100) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  afterEach(async function () {
    await this.close();
    await fs.emptyDir(__dirname + "/data");
  });
});
