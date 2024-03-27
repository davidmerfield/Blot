describe("google drive client: database", function () {
  const database = require("../database");
  const redisKeys = require("util").promisify(require("helper/redisKeys"));

  global.test.blog();

  beforeEach(function () {
    this.db = database.folder(this.blog.id);
  });

  // afterEach(async function () {
  //   await this.folder.print();
  // });

  it("can store and retrieve account information", async function () {
    const blogId = "blog_" + Date.now().toString();
    await database.setAccount(blogId, { foo: "bar" });
    const account = await database.getAccount(blogId);
    expect(account).toEqual({ foo: "bar" });
  });

  it("can determine whether its safe to revoke credentials", async function () {
    const permissionId = "permission_" + Date.now().toString();
    const secondPermissionId = "permission_" + (Date.now() + 1).toString();
    const blogId = "blog_" + Date.now().toString();
    const secondBlogId = "blog_" + (Date.now() + 1).toString();

    expect(await database.canRevoke(permissionId)).toEqual(true);
    await database.setAccount(blogId, { permissionId });
    expect(await database.canRevoke(permissionId)).toEqual(true);
    await database.setAccount(secondBlogId, { permissionId });
    expect(await database.canRevoke(permissionId)).toEqual(false);
    await database.setAccount(secondBlogId, {
      permissionId: secondPermissionId,
    });
    expect(await database.canRevoke(permissionId)).toEqual(true);
    await database.dropAccount(secondBlogId);
    expect(await database.canRevoke(permissionId)).toEqual(true);
  });

  it("deletes the permissionId keys when dropping an account", async function () {
    const blogId = "blog_" + Date.now().toString();
    const permissionId = "permission_" + Date.now().toString();

    await database.setAccount(blogId, { permissionId });
    await database.dropAccount(blogId);
    expect(await redisKeys("*" + permissionId + "*")).toEqual([]);
  });

  it("changing the permissionId removes the corresponding key", async function () {
    const blogId = "blog_" + Date.now().toString();
    const permissionId = "permission_" + Date.now().toString();
    const newPermissionId = "permission_" + (Date.now() + 1).toString();

    await database.setAccount(blogId, { permissionId });
    await database.setAccount(blogId, { permissionId: newPermissionId });
    expect(await redisKeys("*" + permissionId + "*")).toEqual([]);
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

  it("remove returns a list of dropped paths", async function () {
    const { set, remove } = this.db;

    await set("0", "/");
    await set("1", "/bar.txt");
    await set("2", "/foo.txt");

    await set("3", "/foo");
    await set("4", "/foo/too.txt");

    expect((await remove("3")).sort()).toEqual(["/foo", "/foo/too.txt"]);
    expect((await remove("0")).sort()).toEqual(["/", "/bar.txt", "/foo.txt"]);
  });

  it("move handles a single file", async function () {
    const { set, move, get } = this.db;
    await set("123", "/bar.txt");
    await move("123", "/baz.txt");
    expect(await get("123")).toEqual("/baz.txt");
  });

  it("move returns a list of affected paths", async function () {
    const { set, move } = this.db;
    await set("1", "/bar.txt");
    await set("2", "/bar");
    await set("3", "/bar/foo.txt");

    expect((await move("1", "/baz.txt")).sort()).toEqual([
      "/bar.txt",
      "/baz.txt",
    ]);

    expect((await move("2", "/baz")).sort()).toEqual([
      "/bar",
      "/bar/foo.txt",
      "/baz",
      "/baz/foo.txt",
    ]);
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

  it("you can lookup an ID by path", async function () {
    const { set, getByPath } = this.db;
    await set("123", "/bar (1).txt");
    await set("789", "/bar/foo.txt");

    expect(await getByPath("/bar (1).txt")).toEqual("123");
    expect(await getByPath("/bar/foo.txt")).toEqual("789");
    expect(await getByPath("/bar")).toEqual(null);
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
