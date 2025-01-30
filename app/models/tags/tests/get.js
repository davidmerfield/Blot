describe("tags.get", function () {
    
    const set = require("../set");
    const get = require("../get");

    // Create a test user and blog before each spec
    global.test.blog();

    it("can be invoked without error", function (done) {
        const blogID = this.blog.id;
        const entry = {
            id: "entry1",
            blogID: "blog1",
            path: "/entry1",
            tags: ["tag1"],
        };

        set(blogID, entry, function (err) {
            get(blogID, "tag1", function (err, entryIDs, tag) {
                expect(err).toBeNull();
                expect(entryIDs).toEqual([entry.id]);
                expect(tag).toEqual("tag1");
    
                done();
            });
        });
    });
});