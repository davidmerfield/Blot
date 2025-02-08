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


});