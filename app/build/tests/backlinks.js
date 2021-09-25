describe("build", function () {
  var fs = require("fs-extra");

  global.test.blog();

  beforeEach(function () {
    this.build = async (path, contents) => {
      return new Promise((resolve, reject) => {
        fs.outputFileSync(this.blogDirectory + path, contents);
        require("../index")(this.blog, path, {}, function (err, entry) {
          if (err) return reject(err);
          resolve(entry);
        });
      });
    };
  });

  it("will generate a list of internal links", async function (done) {
    const path = "/post.txt";
    const contents = "[linker](/linked)";
    const entry = await this.build(path, contents);

    expect(entry.internalLinks).toEqual(["/linked"]);
    done();
  });

  it("will generate an empty list of internal links", async function (done) {
    const path = "/post.txt";
    const contents = "Hey no link here.";
    const entry = await this.build(path, contents);

    expect(entry.internalLinks).toEqual([]);
    done();
  });

});
