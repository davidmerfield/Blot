describe("entry.search", function () {
  require("./setup")();

  it("works", async function (done) {
    const path = "/post.txt";
    const contents = `Custom: Metadata
    Tags: apple, pear, orange
    
    Hello, world!`;
    const check = (results) => {
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
});
