describe("google drive client: database", function () {
  const database = require("../database");
  const redisKeys = require("util").promisify(require("helper/redisKeys"));

  beforeEach(function () {
    this.db = database.folder(Date.now().toString());
  });

  // afterEach(async function () {
  //   await this.folder.print();
  // });

  it("can store and retrieve account information", async function () {
    await database.setAccount("123", { foo: "bar" });
    const account = await database.getAccount("123");
    expect(account).toEqual({ foo: "bar" });
  });

  it("deletes the folder keys when dropping an account", async function () {
    const blogId = "blog_" + Date.now().toString();
    const folderId = "folder_" + Date.now().toString();
    const fileId = "file_" + Date.now().toString();

    await database.setAccount(blogId, { folderId });
    const { set } = database.folder(folderId);
    await set(fileId, "/Hello.txt");
    await database.dropAccount(blogId);
    expect(await redisKeys("*" + folderId + "*")).toEqual([]);
  });

  it("moves all files in a folder", async function () {
    const { set, move, get } = this.db;

    await set("000", "/foo");
    await set("123", "/foo/bar.txt");
    await set("456", "/foo/too.txt");

    await move("000", "/bar");

    expect(await get("123")).toEqual("/bar/bar.txt");
    expect(await get("456")).toEqual("/bar/too.txt");
  });

  it("del removes all children", async function () {
    const { set, remove, get } = this.db;

    await set("000", "/foo");
    await set("123", "/foo/bar.txt");
    await set("456", "/foo/too.txt");
    await set("789", "/bar.txt");

    await remove("000");

    expect(await get("123")).toEqual(null);
    expect(await get("456")).toEqual(null);
    expect(await get("789")).toEqual("/bar.txt");
  });

  it("del removes all children for root", async function () {
    const { set, remove, get } = this.db;

    await set("000", "/");
    await set("123", "/foo.txt");
    await set("456", "/foo/too.txt");

    await remove("000");

    expect(await get("123")).toEqual(null);
    expect(await get("456")).toEqual(null);
  });

  it("move handles a single file", async function () {
    const { set, move, get } = this.db;
    await set("123", "/bar.txt");
    await move("123", "/baz.txt");
    expect(await get("123")).toEqual("/baz.txt");
  });

  it("move wont clobber a similar file", async function () {
    const { set, move, get } = this.db;
    await set("123", "/bar (1).txt");
    await set("456", "/bar");
    await set("789", "/bar/foo.txt");

    await move("456", "/foo");

    expect(await get("123")).toEqual("/bar (1).txt");
    expect(await get("456")).toEqual("/foo");
    expect(await get("789")).toEqual("/foo/foo.txt");
  });

  it("del wont clobber a similar file", async function () {
    const { set, remove, get } = this.db;
    await set("123", "/bar (1).txt");
    await set("456", "/bar");
    await set("789", "/bar/foo.txt");

    await remove("456");

    expect(await get("123")).toEqual("/bar (1).txt");
    expect(await get("456")).toEqual(null);
    expect(await get("789")).toEqual(null);
  });

  it("move handles folder children", async function () {
    const { set, move, get } = this.db;
    await set("000", "/foo");
    await set("123", "/foo/bar.txt");

    await move("000", "/bar");
    expect(await get("123")).toEqual("/bar/bar.txt");

    await move("123", "/bar/foo.txt");
    expect(await get("123")).toEqual("/bar/foo.txt");
  });
});
