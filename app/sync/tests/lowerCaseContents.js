const lowerCaseContents = require("../lowerCaseContents");
const promisify = require("util").promisify;
const fs = require("fs-extra");
const { join } = require("path");
const entries = require("models/entries");
const rename = require("../rename");
const localPath = require("helper/localPath");

const LONG_TIMEOUT = 10000;

entries.getAll[promisify.custom] = (blogID) =>
  new Promise((resolve, reject) => {
    entries.getAll(blogID, (entries) => {
      resolve(entries);
    });
  });

describe("sync lowerCaseContents", function () {
  // Create test blog
  global.test.blog();

  it("lowercases all files in blog folder", async function () {
    await this.write("/bat.txt", "test 1");
    await this.write("/bAr.txt", "test 2");
    await this.write("/boOo/foO.txt", "test 3");
    await this.write("/bAr/baz.txt", "test 4");
    await this.write("/Drafts/hEy/you.txt", "test 5");
    await this.write("/[draft]yOu.txt", "test 6");
    await this.write("/wIth/case/tEst.pdf", "test 7");
    await this.write("/wIth/emptydir");
    await this.write("/anOtherDir");
    await this.write("/fōO/bbb/te.txt", "test 10");

    const entriesBefore = await this.getAll();
    console.log("entries", entriesBefore);
    const pathsBefore = await this.getContents();
    console.log("pathsBefore", pathsBefore);

    await lowerCaseContents(
      this.blog,
      promisify(rename(this.blog, console.log))
    )();

    const entriesAfter = await this.getAll();
    console.log("entriesAfter", entriesAfter);
    const pathsAfter = await this.getContents();
    console.log("pathsAfter", pathsAfter);

    expect(
      entriesBefore
        .map(({ name, guid }) => {
          return {
            name,
            guid,
          };
        })
        .sort()
    ).toEqual(
      entriesAfter
        .map(({ name, guid }) => {
          return {
            name,
            guid,
          };
        })
        .sort()
    );

    expect(pathsAfter.sort()).toEqual(
      pathsBefore.map((i) => i.toLowerCase()).sort()
    );

    // can we reverse the process?
    await lowerCaseContents(
      this.blog,
      promisify(rename(this.blog, console.log))
    )({ restore: true });

    const entriesRestored = await this.getAll();
    console.log("entries", entriesRestored);
    const pathsRestored = await this.getContents();
    console.log("pathsRestored", pathsRestored);

    expect(entriesRestored.sort()).toEqual(entriesBefore.sort());
    expect(pathsRestored.sort()).toEqual(pathsBefore.sort());
  });

  var originalTimeout;

  beforeEach(function (done) {
    const ctx = this;
    const sync = require("sync");
    const blogID = this.blog.id;

    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = LONG_TIMEOUT;

    ctx.getAll = async () => {
      const allEntries = await promisify(entries.getAll)(this.blog.id);
      return allEntries.map((entry) => {
        return {
          id: entry.id,
          path: entry.path,
          name: entry.name,
          guid: entry.guid,
        };
      });
    };

    ctx.getContents = async (dir = "/") => {
      const contents = [];
      const items = await fs.readdir(localPath(this.blog.id, dir));
      for (const item of items) {
        contents.push(join(dir, item));
        const stat = await fs.stat(localPath(this.blog.id, join(dir, item)));
        if (stat.isDirectory()) {
          const children = await ctx.getContents(join(dir, item));
          for (const child of children) contents.push(child);
        }
      }
      return contents;
    };

    sync(blogID, async function (err, folder, complete) {
      if (err) return done(err);
      ctx.folder = folder;
      ctx.complete = complete;
      ctx.write = async function (path, contents) {
        if (contents) {
          await fs.outputFile(join(folder.path, path), contents);
        } else {
          await fs.ensureDir(join(folder.path, path));
        }
        await promisify(folder.update)(path, {});
      };
      done();
    });
  });

  afterEach(function (done) {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    this.complete(null, done);
  });
});
