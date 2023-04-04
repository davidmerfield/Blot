module.exports = function () {
  const fs = require("fs-extra");

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
    this.flush = () => {};

    this.configure = ({
      directory = this.cache_directory,
      minify = this.minify,
      gzip = this.gzip,
    } = {}) => {
      this.flush = cache(directory, { minify, gzip }).flush;
      app.use(cache(directory, { minify, gzip }));
    };

    this.delay = async (ms = 100) =>
      new Promise((resolve) => setTimeout(resolve, ms));

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

  afterEach(async function () {
    await this.close();
    await fs.emptyDir(__dirname + "/data");
  });
};
