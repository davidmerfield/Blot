describe("renameOrDeDupe ", function () {
  const renameOrDeDupe = require("../renameOrDeDupe");
  const fs = require("fs-extra");
  const { join } = require("path");

  // Set up a test blog before each test
  global.test.blog();

  it("moves a file", async function () {
    await this.check([{ from: "/foo.txt", to: "/bar.txt" }]);
  });

  it("moves a folder", async function () {
    await this.check([{ from: "/foo", to: "/bar" }]);
  });

  it("moves a folder and resolves conflicts", async function () {
    await this.check([
      { from: "/foo", to: "/bat" },
      { from: "/bar", to: "/bat", result: "/bat copy" },
      { from: "/baz", to: "/bat", result: "/bat copy 2" }
    ]);
  });

  it("moves a file into a folder", async function () {
    await this.check([{ from: "/foo.txt", to: "/bar/Baz.txt" }]);
  });

  it("moves a file and resolves a conflict", async function () {
    await this.check([
      { from: "/foo.txt", to: "/bar.txt" },
      { from: "/baz.txt", to: "/bar.txt", result: "/bar copy.txt" },
    ]);
  });

  it("moves a file and resolves many conflicts", async function () {
    await this.check([
      { from: "/foo.txt", to: "/bar.txt" },
      { from: "/bat.txt", to: "/bar.txt", result: "/bar copy.txt" },
      { from: "/baz.txt", to: "/bar.txt", result: "/bar copy 2.txt" },
      { from: "/bac.txt", to: "/bar.txt", result: "/bar copy 3.txt" },
    ]);
  });

  it("moves a file into a folder that already exists", async function () {
    await this.check([
      { from: "/Bar/baz.txt", to: "/Bar/foo.txt" },
      { from: "/foo.txt", to: "/Bar/Bat.txt" },
    ]);
  });

  beforeEach(function () {
    this.check = async (items) => {
      const base = this.blogDirectory;
      const results = {};
      const initialContents = {};

      // create the files
      for (const { from, contents = "bar" } of items) {
        if (from.includes(".")) {
          await fs.outputFile(join(base, from), contents);
          initialContents[from] = contents;
        } else {
          await fs.ensureDir(join(base, from));
        }
      }

      for (const { from, to } of items) {
        const result = await renameOrDeDupe(base, from, to);
        results[from] = result;
      }

      const fileList = allFiles(base).sort();

      for (const { from, to, result } of items) {
        if (from.includes(".")) continue;
        if (result && to !== result) {
          expect(fs.statSync(join(base, result)).isDirectory()).toEqual(true);
          expect(fs.statSync(join(base, to)).isDirectory()).toEqual(true);
        } else {
          expect(fs.statSync(join(base, to)).isDirectory()).toEqual(true);
        }
        expect(fs.existsSync(join(base, from))).toEqual(false);
      }

      // if (items.find(({ from }) => !from.includes("."))) {
      //   const folderList = allFolders(base).sort();
      // }

      expect(fileList).toEqual(
        items
          .filter(({ from }) => from.includes("."))
          .map(({ to, result }) => result || to)
          .sort()
      );

      expect(fileList).toEqual(
        Object.values(results)
          .filter((result) => result.includes("."))
          .sort()
      );

      items.forEach(({ to, from }) => {
        if (from.includes(".")) {
          expect(fs.readFileSync(join(base, to), "utf-8")).toEqual(
            initialContents[from]
          );
        }
      });
    };
  });

  function allFiles(base, path = "/") {
    var results = [];
    var list = fs.readdirSync(join(base, path));
    list.forEach(function (file) {
      file = join(path, file);
      var stat = fs.statSync(join(base, file));
      if (stat && stat.isDirectory()) {
        /* Recurse into a subdirectory */
        results = results.concat(allFiles(base, file));
      } else {
        results.push(file);
        /* Is a file */
      }
    });
    return results;
  }
});
