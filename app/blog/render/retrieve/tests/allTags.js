describe("allTags", function () {
  var allTags = require("blog/render/retrieve/allTags");
  var Entry = require("models/entry");

  global.test.blog();

  beforeEach(function () {
    this.request = {
      protocol: "http",
      blog: this.blog,
      get: function () {
        return "example.com";
      },
    };
  });

  beforeEach(function (done) {
    const firstEntry = {
      path: "/foo.txt",
      id: "/foo.txt",
      name: "foo.txt",
      title: "Foo",
      titleTag: "",
      body: "",
      summary: "",
      teaser: "",
      teaserBody: "",
      metadata: {},
      thumbnail: {},
      draft: false,
      page: false,
      menu: false,
      deleted: false,
      more: false,
      updated: Date.now(),
      tags: ['abc'],
      html: "",
      slug: "",
      size: 0,
    };

    const secondEntry = {
      ...firstEntry,
      path: "/bar.txt",
      id: "/bar.txt",
      name: "bar.txt",
      title: "Bar",
    };

    Entry.set(this.blog.id, firstEntry.path, firstEntry, (err) => {
      if (err) return done(err);
      Entry.set(this.blog.id, secondEntry.path, secondEntry, done);
    });
  });

  it("displays entries in chronological order", function (done) {
    allTags(this.request, function (err, tags) {
      expect(tags.length).toEqual(1);
      expect(tags[0].entries.length).toEqual(2);
      expect(tags[0].entries[0].name).toEqual('bar.txt');
      expect(tags[0].entries[1].name).toEqual('foo.txt');
      done();
    });
  });
});
