describe("rename", function () {
  const syncWithCallback = require("../index");
  var fs = require("fs-extra");
  const { promisify } = require("util");
  const { join } = require("path");
  const rename = require("../rename");
  const Entry = require("models/entry");

  Entry.get[promisify.custom] = (blogID, path) =>
    new Promise((resolve, reject) => {
      Entry.get(blogID, path, (entry) => {
        resolve(entry);
      });
    });

  syncWithCallback[promisify.custom] = (blogID) =>
    new Promise((resolve, reject) => {
      syncWithCallback(blogID, (err, folder, done) => {
        if (err) {
          reject(err);
        } else {
          folder.update = promisify(folder.update);
          resolve({ folder, done: promisify(done) });
        }
      });
    });

  const sync = promisify(syncWithCallback);
  const getEntry = promisify(Entry.get);

  // Set up a test blog before each test
  global.test.blog();

  // Expose methods for creating fake files, paths, etc.
  beforeEach(function () {
    this.fake = global.test.fake;
    this.rename = promisify(rename(this.blog, console.log));
  });

  beforeEach(function () {
    this.checkEntry = promisify(global.test.CheckEntry(this.blog.id));
  });

  it("renames an entry ", async function () {
    const oldPath = this.fake.path(".txt");
    const path = this.fake.path(".txt");
    const content = this.fake.file();
    const { folder, done } = await sync(this.blog.id);

    await fs.outputFile(join(folder.path, oldPath), content, "utf-8");
    await folder.update(oldPath);

    await fs.move(join(folder.path, oldPath), join(folder.path, path));
    await this.rename(path, oldPath, {});

    await this.checkEntry({ path });
    await this.checkEntry({ path: oldPath, deleted: true });

    await done(null);
  });

  it("destroys the old guid an entry ", async function () {
    const oldPath = this.fake.path(".txt");
    const path = this.fake.path(".txt");
    const content = this.fake.file();
    const { folder, done } = await sync(this.blog.id);

    await fs.outputFile(join(folder.path, oldPath), content, "utf-8");
    await folder.update(oldPath);

    const originalEntry = await getEntry(this.blog.id, oldPath);

    await fs.move(join(folder.path, oldPath), join(folder.path, path));
    await this.rename(path, oldPath, {});

    const movedEntry = await getEntry(this.blog.id, path);
    expect(movedEntry.guid).toEqual(originalEntry.guid);

    const formerEntry = await getEntry(this.blog.id, oldPath);

    expect(formerEntry.deleted).toEqual(true);
    expect(formerEntry.guid).not.toEqual(movedEntry.guid);

    await done(null);
  });
});
