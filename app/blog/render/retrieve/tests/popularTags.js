describe("popular tags", function () {

    require('blog/tests/util/setup')();

    it("lists popular tags", async function () {
        
        await this.write({path: '/a.txt', content: 'Tags: abc\n\nFoo'});
        await this.write({path: '/b.txt', content: 'Tags: abc\n\nBar'});
        await this.write({path: '/c.txt', content: 'Tags: def\n\nBaz'});
        await this.write({path: '/d.txt', content: 'Tags: def\n\nQux'});
        await this.write({path: '/e.txt', content: 'Tags: def\n\nQuux'});

        await this.template({
            'entries.html': `<ul>{{#popular_tags}}<li>{{tag}}</li>{{/popular_tags}}</ul>`
        });

        const res = await this.get('/');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body.trim()).toEqual('<ul><li>def</li><li>abc</li></ul>');
    });

    it("lists popular tags with many posts", async function () {
        const tags = Array.from({ length: 100 }, (_, i) => `tag${i}`);
        const tagUsage = {};
    
        for (let i = 0; i < 200; i++) {
            const numTags = (i % 5) + 1; // Deterministically assign the number of tags
            const postTags = tags.slice(0, numTags); // Use the first `numTags` tags
            for (const tag of postTags) {
                tagUsage[tag] = (tagUsage[tag] || 0) + 1;
            }
            await this.blog.write({ path: `/post${i}.txt`, content: `Tags: ${postTags.join(', ')}\n\nContent ${i}` });
        }
    
        await this.blog.rebuild();
    
        await this.template({
            'entries.html': `<ul>{{#popular_tags}}<li>{{tag}} {{entries.length}}</li>{{/popular_tags}}</ul>`
        });
    
        const res = await this.get('/');
        const body = await res.text();
    
        const sortedTags = Object.keys(tagUsage).sort((a, b) => tagUsage[b] - tagUsage[a]);
        const expectedHtml = `<ul>${sortedTags.map(tag => `<li>${tag} ${tagUsage[tag]}</li>`).join('')}</ul>`;
    
        expect(res.status).toEqual(200);
        expect(body.trim()).toEqual(expectedHtml);
    }, 30000);


});