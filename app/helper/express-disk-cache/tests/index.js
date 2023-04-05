describe("express-disk-cache", function () {
  
  it("will error if you do not pass a cache directory", async function () {
    expect(function () {
      const cache = require("../index");
      cache();
    }).toThrow();
  });

  it("works", async function () {
    const { app, listen, fetch, readFile, configure, delay } = this;

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
    const { app, listen, fetch, readFile, configure, delay } = this;

    configure({ gzip: true });

    app.get("/", (req, res) => res.send("<h1>Hello, world!</h1>"));

    await listen();

    expect(await fetch("/")).toEqual(`<h1>Hello, world!</h1>`);

    await delay();
    const { gunzipSync } = require("zlib");

    expect(
      gunzipSync(
        await readFile("/localhost/http/temporary/index.htmlgzip", null)
      ).toString()
    ).toEqual("<h1>Hello, world!</h1>");
  });

  it("minifies HTML", async function () {
    const { app, listen, fetch, readFile, configure, delay } = this;

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
    const { app, listen, fetch, readFile, configure, delay } = this;

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
    const { app, listen, fetch, readFile, configure, delay } = this;

    configure({ minify: true });

    app.get("/script.js", (req, res) => res.send(" \n alert( 'Hey' + 1 ) \n"));

    await listen();

    expect(await fetch("/script.js")).toEqual(" \n alert( 'Hey' + 1 ) \n");

    await delay();

    expect(await readFile("/localhost/http/temporary/script.js")).toEqual(
      "alert( 'Hey' + 1 )"
    );
  });

  require("./setup")();
});
