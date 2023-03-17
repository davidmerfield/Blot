const lowerCaseContents = require("../lowerCaseContents");
const promisify = require("util").promisify;
const fs = require("fs-extra");
const { join } = require("path");
const entries = require("models/entries");
const localPath = require("helper/localPath");
const getMetadata = promisify(require("models/metadata").get);

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
    await this.write("/bAr.txt", "test 2");
    await this.write("/boOo/foO.txt", "test 3");
    await this.write("/bAr/baz.txt", "test 4");
    await this.write("/Drafts/hEy/you.txt", "test 5");
    await this.write("/[draft]yOu.txt", "test 6");
    await this.write("/wIth/case/tEst.pdf", "test 7");
    await this.write("/wIth/emptydir");
    await this.write("/anOtherDir");
    await this.write("/fōO/bbb/te.txt", "test 10");
  });

  it("handles drafts and previews", async function () {
    await this.write("/Drafts/Vælid post.txt", "Valid post");
    await this.check();
  });

  it("handles case-conflicting directories", async function () {
    await this.write("/basil/foo.txt", "test 1");
    await this.write("/Basil/bar.txt", "test 2");

    await this.check({
      expectPaths: [
        "/basil",
        "/basil copy",
        "/basil/foo.txt",
        "/basil copy/bar.txt",
      ],
      expectMetadata: {
        "/basil copy": "Basil copy",
      },
    });
  });

  it("handles nested conflicting files and directories", async function () {
    await this.write("/Hello.txt", "test 1");
    await this.write("/hello.txt", "test 2");
    await this.write("/subDir/Hello.txt", "test 3");
    await this.write("/subDir/hello.txt", "test 4");
    await this.write("/subdir/Hello.txt", "test 5");
    await this.write("/subdir/hello.txt", "test 6");

    await this.check({
      expectPaths: [
        "/hello.txt",
        "/hello copy.txt",
        "/subdir",
        "/subdir/hello.txt",
        "/subdir/hello copy.txt",
        "/subdir copy",
        "/subdir copy/hello.txt",
        "/subdir copy/hello copy.txt",
      ],
      expectMetadata: {
        "/hello.txt": null,
        "/subdir/hello.txt": null,
        "/subdir": null,
        "/subdir copy": "subDir copy",
        "/subdir copy/hello.txt": null,
        "/hello copy.txt": "Hello copy.txt",
        "/subdir/hello copy.txt": "Hello copy.txt",
        "/subdir copy/hello copy.txt": "Hello copy.txt",
      },
    });
  });

  it("handles case-conflicting files", async function () {
    await this.write("/fOo.txt", "test 1");
    await this.write("/FoO.txt", "test 2");
    await this.write("/FOO.txt", "test 3");

    await this.check({
      expectPaths: ["/foo.txt", "/foo copy.txt", "/foo copy 2.txt"],
      expectMetadata: {
        // the order of these is affected by the sorting
        // added as a hack to lowerCaseContents so don't
        // be alarmed if you need to move the names around
        "/foo.txt": "fOo.txt",
        "/foo copy.txt": "FoO copy.txt",
        "/foo copy 2.txt": "FOO copy 2.txt",
      },
    });
  });

  it("handles case-conflicting directories with case-y parents", async function () {
    await this.write("/Bar/templates/foo.txt", "test 1");
    await this.write("/Bar/Templates/bar.txt", "test 2");

    await this.check({
      expectPaths: [
        "/bar",
        "/bar/templates",
        "/bar/templates copy",
        "/bar/templates/foo.txt",
        "/bar/templates copy/bar.txt",
      ],
    });
  });

  it("handles case-conflicting files with case-y parents", async function () {
    await this.write("/Templates/fOo.txt", "test 1");
    await this.write("/Templates/FoO.txt", "test 2");

    await this.check({
      expectPaths: [
        "/templates",
        "/templates/foo.txt",
        "/templates/foo copy.txt",
      ],
    });
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
      ctx.check = async function check({
        expectPaths = null,
        expectMetadata = null,
      } = {}) {
        const entriesBefore = await ctx.getAll();
        const pathsBefore = await ctx.getContents();

        await lowerCaseContents(ctx.blog.id);

        const entriesAfter = await ctx.getAll();
        const pathsAfter = await ctx.getContents();

        // Are there the same number of entries and files?
        expect(pathsAfter.length).toEqual(pathsBefore.length);
        expect(entriesBefore.length).toEqual(entriesAfter.length);

        // Has lowercase actually made the files and folders lowercase?
        pathsAfter.forEach((path) => {
          expect(path).toEqual(path.toLowerCase());
        });

        // Has lowercase moved the entries too?
        entriesAfter.forEach(({ path }) => {
          expect(path).toEqual(path.toLowerCase());
          expect(pathsAfter.includes(path)).toBe(true);
        });

        if (!expectPaths) {
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
        }

        if (expectMetadata) {
          for (const path of Object.keys(expectMetadata))
            expect(await getMetadata(ctx.blog.id, path)).toEqual(
              expectMetadata[path]
            );
        }

        if (expectPaths) {
          expect(pathsAfter.sort()).toEqual(expectPaths.sort());
          entriesAfter
            .map(({ id }) => id)
            .forEach((path) => {
              expect(expectPaths.includes(path)).toBe(true);
            });
        }

        // can we reverse the process?
        await lowerCaseContents(ctx.blog.id, { restore: true });

        const entriesRestored = await ctx.getAll();
        const pathsRestored = await ctx.getContents();

        if (expectPaths) {
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
