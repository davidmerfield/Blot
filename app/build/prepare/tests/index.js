fdescribe("prepare", function() {
  var prepare = require("../index");

  beforeEach(function() {
    this.entry = {
      path: "",
      size: 123,
      html: "",
      updated: 123,
      draft: true,
      metadata: {}
    };
  });

  // This was the result of a rather niche bug, caused by files like this:
  // Title:
  // Hello world!
  // Blot was generating an empty title *and* an empty empty summary, since
  // 'Hello world!' was in the auto-generated title but not the metadata
  // title. The summary generated is now passed the metadata title too...
  it("includes what would become the title, in the summary, if the title is set to empty in the file's metadata", function() {
    var entry = this.entry;

    entry.html = "<p>Hey there.</p>";
    entry.metadata = {
      title: ""
    };

    prepare(entry);

    expect(entry.title).toEqual("");
    expect(entry.summary).toEqual("Hey there.");
  });

  it("generates an empty title when given an empty file", function() {
    var entry = this.entry;

    entry.html = "";
    
    prepare(entry);

    expect(entry.title).toEqual("");
  });
});
