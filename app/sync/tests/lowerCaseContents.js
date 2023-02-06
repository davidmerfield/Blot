const lowerCaseContents = require("../lowerCaseContents");
const promisify = require("util").promisify;
const fs = require("fs-extra");
const { join } = require("path");
const entries = require("models/entries");
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

  it("handles case-conflicting directories", async function () {
    await this.write("/templates/foo.txt", "test 1");
    await this.write("/Templates/bar.txt", "test 2");

    await this.check();
  });

  it("handles case-conflicting directories with case-y parents", async function () {
    await this.write("/Bar/templates/foo.txt", "test 1");
    await this.write("/Bar/Templates/bar.txt", "test 2");

    await this.check();
  });

  it("handles case-conflicting files", async function () {
    await this.write("/fOo.txt", "test 1");
    await this.write("/FoO.txt", "test 2");

    await this.check();
  });

  it("handles case-conflicting files with case-y parents", async function () {
    await this.write("/Templates/fOo.txt", "test 1");
    await this.write("/Templates/FoO.txt", "test 2");

    await this.check();
  });

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

    await this.check();
  });

  var originalTimeout;
  const rename = require("../rename");

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
      ctx.check = async function check() {
        const entriesBefore = await ctx.getAll();
        console.log("entries", entriesBefore);
        const pathsBefore = await ctx.getContents();
        console.log("pathsBefore", pathsBefore);

        await lowerCaseContents(
          ctx.blog,
          promisify(rename(ctx.blog, console.log))
        )();

        const entriesAfter = await ctx.getAll();
        console.log("entriesAfter", entriesAfter);
        const pathsAfter = await ctx.getContents();
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
          ctx.blog,
          promisify(rename(ctx.blog, console.log))
        )({ restore: true });

        const entriesRestored = await ctx.getAll();
        console.log("entries", entriesRestored);
        const pathsRestored = await ctx.getContents();
        console.log("pathsRestored", pathsRestored);

        expect(entriesRestored.sort()).toEqual(entriesBefore.sort());
        expect(pathsRestored.sort()).toEqual(pathsBefore.sort());
      };
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
