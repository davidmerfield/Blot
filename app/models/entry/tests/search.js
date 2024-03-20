describe("entry.search", function () {
  require("./setup")();

  it("works with a single entry", async function (done) {
    const path = "/post.txt";
    const contents = `Custom: Metadata hello!
    Tags: apple, pear, orange
    
    Hello, world!`;

    const check = results => {
      expect(results.length).toEqual(1);
      expect(results[0].id).toEqual(path);
    };

    await this.set(path, contents);

    // Exact match
    check(await this.search("Hello"));

    // Lowercase
    check(await this.search("hello"));

    // With extra whitespace
    check(await this.search("  hello  "));

    // With multiple terms
    check(await this.search("hello world"));

    // File name
    check(await this.search("post.txt"));

    // Custom metadata values
    check(await this.search("metadata"));

    // Tags
    check(await this.search("apple"));

    done();
  });

  it("works with two entries", async function (done) {
    const path1 = "/post.txt";
    const contents1 = `Custom: Metadata hello!
    Tags: apple, pear, orange
    
    Hello, you!`;

    const path2 = "/post2.txt";
    const contents2 = `Custom: Metadata hello!
    Tags: apple, pear, orange
    
    Hello, me!`;

    const check = results => {
      // sort results by id
      results.sort((a, b) => a.id.localeCompare(b.id));

      expect(results.length).toEqual(2);
      expect(results[0].id).toEqual(path1);
      expect(results[1].id).toEqual(path2);
    };

    await this.set(path1, contents1);
    await this.set(path2, contents2);

    // Exact match
    check(await this.search("Hello"));

    // Lowercase
    check(await this.search("hello"));

    done();
  });

  it("supports non-latin characters", async function (done) {
    const path = "/post.txt";
    const contents = `Custom: Metadata hello!
    Tags: apple, pear, orange
    
    你好，世界！`;

    const check = results => {
      expect(results.length).toEqual(1);
      expect(results[0].id).toEqual(path);
    };

    await this.set(path, contents);

    // Exact match
    check(await this.search("你好"));

    // Lowercase
    check(await this.search("你好"));

    done();
  });

  it("ignores deleted entries", async function (done) {
    const path = "/post.txt";
    const contents = `Hello, world!`;

    await this.set(path, contents);

    expect((await this.search("Hello")).length).toEqual(1);

    await this.remove(path);

    expect((await this.search("Hello")).length).toEqual(0);

    done();
  });

  it("ignores entries with Search: no metadata", async function (done) {
    const path = "/post.txt";
    const contents = `Search: no
    Custom: Metadata hello!
    Tags: apple, pear, orange
    
    Hello, world!`;

    const check = results => {
      expect(results.length).toEqual(0);
    };

    await this.set(path, contents);

    // Exact match
    check(await this.search("Hello"));

    done();
  });

  it("includes pages with Search: yes metadata", async function (done) {
    const path = "/Pages/About.txt";
    const contents = `Search: yes
    Custom: Metadata hello!
    Tags: apple, pear, orange
    
    Hello, world!`;

    const check = results => {
      expect(results.length).toEqual(1);
      expect(results[0].id).toEqual(path);
    };

    await this.set(path, contents);

    // Exact match
    check(await this.search("Hello"));

    done();
  });
});
