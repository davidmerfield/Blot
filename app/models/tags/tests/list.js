describe("tags.list", function () {
    
    const set = require("../set");
    const list = require("../list");

    // Create a test user and blog before each spec
    global.test.blog();

    it("it is fast for thousands of tags and entries", async function (done) {
        const tags = [];
        for (let i = 0; i < 1000; i++) {
            tags.push({
                id: `tag${i}`,
            });
        }

        for (let i = 0; i < 1000; i++) {
            // guarantee at least one tag per entry, and each tag is used at least once
            const entryTags = [{id: `tag${i}`}];
            const numberOfTags = Math.floor(Math.random() * 100) + 1;
            for (let j = 0; j < numberOfTags; j++) {
                const randomIndex = Math.floor(Math.random() * tags.length);
                entryTags.push(tags[randomIndex]);
            }
            await this.blog.write({path: `/entry${i}.txt`, content: `Tags: ${entryTags.map(tag => tag.id).join(", ")}\n\nContent ${i}`});
        }

        await this.blog.rebuild();

        const start = Date.now();

        list(this.blog.id, function (err, tags) {
            expect(err).toBeNull();
            expect(tags.length).toEqual(1000);
            console.log("Time taken: ", (Date.now() - start) + "ms");
            done();
        });
    }, 30000);

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
                    
                    const sortedTags = tags.sort((a, b) => a.slug.localeCompare(b.slug)).map(tag => {
                        return {
                            name: tag.name,
                            slug: tag.slug,
                            entries: tag.entries.sort()
                        };
                    });

                    expect(sortedTags).toEqual([
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