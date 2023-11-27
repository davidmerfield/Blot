describe("metadata", function () {
  global.test.blog();

  const { promisify } = require("util");
  const Metadata = require("models/metadata");
  const add = promisify(Metadata.add);
  const drop = promisify(Metadata.drop);
  const get = promisify(Metadata.get);
  const getPath = promisify(Metadata.getPath);

  it("works", async function (done) {
    const path = "/hello.txt";
    const name = "Hello.txt";

    let result = await add(this.blog.id, path, name);

    expect(result).toEqual(undefined);

    let stored = await get(this.blog.id, path);

    expect(stored).toEqual(name);

    result = await drop(this.blog.id, path);

    expect(result).toEqual(undefined);

    stored = await get(this.blog.id, path);

    expect(stored).toEqual(null);

    done();
  });

  it("lets you get a path", async function (done) {
    await add(this.blog.id, "/hello", "HeLlO");
    await add(this.blog.id, "/hello/world.txt", "wOrLd.txt");

    expect(await getPath(this.blog.id, "/hello")).toEqual("/HeLlO");
    expect(await getPath(this.blog.id, "hello")).toEqual("/HeLlO");
    expect(await getPath(this.blog.id, "//hello//")).toEqual("/HeLlO");

    expect(await getPath(this.blog.id, "/hello/world.txt")).toEqual(
      "/HeLlO/wOrLd.txt"
    );

    done();
  });
});
