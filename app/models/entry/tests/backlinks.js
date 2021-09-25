describe("entry has backlinks", function () {
  const fs = require("fs-extra");
  const build = require("build");
  const get = require("../get");
  const set = require("../set");

  global.test.blog();

  beforeEach(function () {
    this.get = async (path) => {
      return new Promise((resolve) => {
        get(this.blog.id, path, (entry) => {
          resolve(entry);
        });
      });
    };

    this.set = async (path, contents) => {
      return new Promise((resolve, reject) => {
        fs.outputFileSync(this.blogDirectory + path, contents);
        build(this.blog, path, {}, (err, entry) => {
          if (err) return reject(err);
          set(this.blog.id, path, entry, (err) => {
            if (err) return reject(err);
            get(this.blog.id, path, (entry) => {
              resolve(entry);
            });
          });
        });
      });
    };
  });

  it("will generate a list of back links", async function (done) {
    const path = "/post.txt";
    const contents = "Link: linker\n\n[linker](/linked)";

    const pathLinked = "/linked.txt";
    const contentsLinked = "Link: linked\n\nHey";

    await this.set(pathLinked, contentsLinked);
    await this.set(path, contents);

    const entry = await this.get(pathLinked);

    expect(entry.backlinks).toEqual(["/linker"]);
    done();
  });
});
