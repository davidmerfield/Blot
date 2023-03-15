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

describe("lowerCaseContents", function () {
  // Create test blog
  global.test.blog();

  it("lowercases folder contents", async function () {
    await this.write("/Posts/Foo/Bar.txt", "test 1");
    await this.write("/Posts/Baz.txt", "test 2");
    await this.write("/Posts/sub/Baz/Bat.txt", "test 3");
    await this.write("/BaT.txt", "test 4");

    await this.check({ expectConflict: false });
  });

  it("handles case-conflicting directories", async function () {
    await this.write("/basil/foo.txt", "test 1");
    await this.write("/Basil/bar.txt", "test 2");

    await this.check({ expectConflict: true });
  });

  it("handles case-conflicting files", async function () {
    await this.write("/fOo.txt", "test 1");
    await this.write("/FoO.txt", "test 2");

    await this.check({ expectConflict: true });
  });

  it("handles case-conflicting directories with case-y parents", async function () {
    await this.write("/Bar/templates/foo.txt", "test 1");
    await this.write("/Bar/Templates/bar.txt", "test 2");

    await this.check({ expectConflict: true });
  });

  it("handles case-conflicting files with case-y parents", async function () {
    await this.write("/Templates/fOo.txt", "test 1");
    await this.write("/Templates/FoO.txt", "test 2");

    await this.check({ expectConflict: true });
  });

  it("lowercases all files and folders in blog folder", async function () {
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
      return allEntries
        .map((entry) => {
          return {
            id: entry.id,
            path: entry.path,
            name: entry.name,
            guid: entry.guid,
          };
        })
        .sort((a, b) => {
          return a.id < b.id;
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
      return contents.sort();
    };

    sync(blogID, async function (err, folder, complete) {
      if (err) return done(err);
      ctx.folder = folder;
      ctx.complete = complete;
      ctx.check = async function check({ expectConflict = false } = {}) {
        const entriesBefore = await ctx.getAll();
        const pathsBefore = await ctx.getContents();

        await lowerCaseContents(ctx.blog.id);

        const entriesAfter = await ctx.getAll();
        const pathsAfter = await ctx.getContents();

        // Has lowercase actually worked?
        pathsAfter.forEach((path) => {
          expect(path).toEqual(path.toLowerCase());
        });
        entriesAfter.forEach(({ path }) => {
          expect(path).toEqual(path.toLowerCase());
        });

        // Have we stored the case-y path in the db?
        // pathsAfter.forEach((path, i)=>{
        //   if (path !== pathsBefore[i])
        //     const
        // })

        if (!expectConflict) {
          expect(
            entriesBefore.map(({ name, guid }) => {
              return {
                name,
                guid,
              };
            })
          ).toEqual(
            entriesAfter.map(({ name, guid }) => {
              return {
                name,
                guid,
              };
            })
          );
          expect(pathsAfter.sort()).toEqual(
            pathsBefore.map((i) => i.toLowerCase()).sort()
          );
        } else {
          expect(pathsAfter.length).toEqual(pathsBefore.length);
          expect(entriesBefore.length).toEqual(entriesAfter.length);
        }

        // can we reverse the process?
        await lowerCaseContents(ctx.blog.id, { restore: true });

        const entriesRestored = await ctx.getAll();
        const pathsRestored = await ctx.getContents();

        if (expectConflict) {
          expect(entriesRestored.length).toEqual(entriesBefore.length);
          expect(pathsRestored.length).toEqual(pathsBefore.length);
        } else {
          expect(entriesRestored).toEqual(entriesBefore);
          expect(pathsRestored).toEqual(pathsBefore);
        }
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
