describe("db", () => {
  const { get, set, del, move, print } = require("./db");
  let folderId;

  beforeEach(() => (folderId = Date.now().toString()));
  afterEach(() => print(folderId));

  it("moves all files in a folder", async () => {
    await set(folderId, "000", "/foo");
    await set(folderId, "123", "/foo/bar.txt");
    await set(folderId, "456", "/foo/too.txt");

    await move(folderId, "000", "/bar");

    expect(await get(folderId, "123")).toEqual("/bar/bar.txt");
    expect(await get(folderId, "456")).toEqual("/bar/too.txt");
  });

  it("del removes all children", async () => {
    await set(folderId, "000", "/foo");
    await set(folderId, "123", "/foo/bar.txt");
    await set(folderId, "456", "/foo/too.txt");
    await set(folderId, "789", "/bar.txt");

    await del(folderId, "000");

    expect(await get(folderId, "123")).toEqual(null);
    expect(await get(folderId, "456")).toEqual(null);
    expect(await get(folderId, "789")).toEqual("/bar.txt");
  });

  it("del removes all children for root", async () => {
    await set(folderId, "000", "/");
    await set(folderId, "123", "/foo.txt");
    await set(folderId, "456", "/foo/too.txt");

    await del(folderId, "000");

    expect(await get(folderId, "123")).toEqual(null);
    expect(await get(folderId, "456")).toEqual(null);
  });

  it("move handles a single file", async () => {
    await set(folderId, "123", "/bar.txt");
    await move(folderId, "123", "/baz.txt");
    expect(await get(folderId, "123")).toEqual("/baz.txt");
  });

  it("move wont clobber a similar file", async () => {
    await set(folderId, "123", "/bar (1).txt");
    await set(folderId, "456", "/bar");
    await set(folderId, "789", "/bar/foo.txt");

    await move(folderId, "456", "/foo");

    expect(await get(folderId, "123")).toEqual("/bar (1).txt");
    expect(await get(folderId, "456")).toEqual("/foo");
    expect(await get(folderId, "789")).toEqual("/foo/foo.txt");
  });

  it("del wont clobber a similar file", async () => {
    await set(folderId, "123", "/bar (1).txt");
    await set(folderId, "456", "/bar");
    await set(folderId, "789", "/bar/foo.txt");

    await del(folderId, "456");

    expect(await get(folderId, "123")).toEqual("/bar (1).txt");
    expect(await get(folderId, "456")).toEqual(null);
    expect(await get(folderId, "789")).toEqual(null);
  });

  it("move handles folder children", async () => {
    await set(folderId, "000", "/foo");
    await set(folderId, "123", "/foo/bar.txt");

    await move(folderId, "000", "/bar");
    expect(await get(folderId, "123")).toEqual("/bar/bar.txt");

    await move(folderId, "123", "/bar/foo.txt");
    expect(await get(folderId, "123")).toEqual("/bar/foo.txt");
  });
});
