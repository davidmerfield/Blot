const fs = require("fs-extra");
const extractBibAndCSL = require("../extractBibAndCSL");

describe("markdown converter bib/csl extractor", function () {
  global.test.blog();

  it("extracts a bib and csl", function (done) {
    let path = "/Hello.txt";
    let text = `CSL: hey.csl\nBibliography: you.bib`;
    fs.outputFileSync(this.blogDirectory + "/hey.csl", "Hey");
    fs.outputFileSync(this.blogDirectory + "/you.bib", "Hey");
    extractBibAndCSL(this.blog, path, text, (err, bib, csl) => {
      if (err) return done.fail(err);
      expect(bib).toEqual(this.blogDirectory + "/you.bib");
      expect(csl).toEqual(this.blogDirectory + "/hey.csl");
      done();
    });
  });

  it("only extracts a bib and csl whose files exist", function (done) {
    let path = "/Hello.txt";
    let text = `CSL: hey.csl\nBibliography: you.bib`;
    fs.outputFileSync(this.blogDirectory + "/you.bib", "Hey");
    extractBibAndCSL(this.blog, path, text, (err, bib, csl) => {
      if (err) return done.fail(err);
      expect(bib).toEqual(this.blogDirectory + "/you.bib");
      expect(csl).toEqual("");
      done();
    });
  });

  it("resolves a relative bib and csl", function (done) {
    let path = "/Hello/world.txt";
    let text = `CSL: ../hEY.csl\nBibliography: yOu.bib`;
    fs.outputFileSync(this.blogDirectory + "/Hello/you.bib", "Hey");
    fs.outputFileSync(this.blogDirectory + "/hey.csl", "Hey");
    extractBibAndCSL(this.blog, path, text, (err, bib, csl) => {
      if (err) return done.fail(err);
      expect(bib).toEqual(this.blogDirectory + "/Hello/you.bib");
      expect(csl).toEqual(this.blogDirectory + "/hey.csl");
      done();
    });
  });

  it("resolves an absolute bib and csl", function (done) {
    let path = "/Hello/yOu/World.txt";
    let text = `CSL: /Hello/hEY.csl\nBibliography: /yOu.bib`;
    fs.outputFileSync(this.blogDirectory + "/you.bib", "Hey");
    fs.outputFileSync(this.blogDirectory + "/Hello/hey.csl", "Hey");
    extractBibAndCSL(this.blog, path, text, (err, bib, csl) => {
      if (err) return done.fail(err);
      expect(bib).toEqual(this.blogDirectory + "/you.bib");
      expect(csl).toEqual(this.blogDirectory + "/Hello/hey.csl");
      done();
    });
  });
});
