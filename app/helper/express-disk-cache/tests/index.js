const fs = require("fs-extra");

describe("express-disk-cache", function () {
  it("works", async function () {
    const { app, listen, fetch, readFile } = this;

    app.get("/", (req, res) => res.send("Hello, world!"));

    await listen();

    expect(await fetch("/")).toEqual(`Hello, world!`);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(await readFile("/localhost/http/temporary/index.html")).toEqual("Hello, world!");
  });

  beforeEach(async function () {
    const fetch = require("node-fetch");
    const { join } = require("path");
    const port = 7766;
    const express = require("express");
    const cache = require("../index");
    const app = express();
    const cache_directory = __dirname + "/data";

    app.use(cache(cache_directory));

    this.app = app;
    this.cache_directory = cache_directory;
    this.readFile = (path) =>
      fs.readFile(join(cache_directory, path), "utf-8");

    let server;

    this.listen = async () => {
      server = await app.listen(port);
    };

    this.close = async () => await server.close();

    this.fetch = async (path) => {
      const res = await fetch(`http://localhost:${port}${path}`);
      return await res.text();
    };
  });

  afterEach(async function () {
    await this.close();
    await fs.emptyDir(__dirname + "/data");
  });
});
