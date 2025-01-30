describe("tags.list", function () {
    
    const set = require("../set");
    const list = require("../list");

    // Create a test user and blog before each spec
    global.test.blog();

    it("can be invoked without error", function (done) {
        const blogID = this.blog.id;
        const entry1 = {
            id: "entry1",
            path: "/entry1",
            tags: ["tag1", "tag2"],
        };

        const entry2 = {
            id: "entry2",
            path: "/entry2",
            tags: ["tag2", "tag3"],
        };

        set(blogID, entry1, function (err) {
            set(blogID, entry2, function (err) {
                list(blogID, function (err, tags) {
                    expect(err).toBeNull();
                    expect(tags).toEqual([
                        { name: 'tag1', slug: 'tag1', entries: [ 'entry1' ] },
                        { name: 'tag2', slug: 'tag2', entries: [ 'entry1', 'entry2' ] },
                        { name: 'tag3', slug: 'tag3', entries: [ 'entry2' ] }
                    ]);
                    done();
                });
            });
        });
    });
});