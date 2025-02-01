describe("routing", function () {

    require('./util/setup')();

    it("when there are duplicate URLs, router will serve a template view, then an entry, then a file in that order", async function () {

        // Prepare the template, entry, and file
        await this.write({path: '/foo.txt', content: 'Link: /about.txt\n\nENTRY'});
        await this.template({ 'about.txt': 'VIEW' });
        await this.write({path: '/about.txt', content: 'FILE'});

        // Check that the template view is served first
        const res = await this.get('/about.txt');
        const body = await res.text();
        expect(res.status).toEqual(200);
        expect(body.trim()).toEqual('VIEW');

        // remove the template view
        await this.template({ 'entry.html': '{{{entry.html}}}' });

        // Check that the entry is served next
        const res2 = await this.get('/about.txt');
        const body2 = await res2.text();
        expect(res2.status).toEqual(200);
        expect(body2.trim()).toContain('ENTRY');

        // remove the entry
        await this.remove('/foo.txt');

        // Check that the file is served last
        const res3 = await this.get('/about.txt');
        const body3 = await res3.text();
        expect(res3.status).toEqual(200);
        expect(body3.trim()).toEqual('FILE');
    });

});