describe("pluginHTML", function () {

    require('./util/setup')();

    // this is designed to prevent search engines from indexing the blog twice
    it("injects plugin HTML", async function () {

        // enable the commento plugin
        const plugins = {...this.blog.plugins, commento: {enabled: true, options: {}}};
        await this.blog.update({plugins})

        await this.template({ "entry.html": "{{{entry.html}}} {{> pluginHTML}}" });
        await this.write({path: '/a.txt', content: 'Link: /foo\n\nHello, world!'});        

        const res = await this.get('/foo');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('<script defer');
        expect(body).toContain('src="https://cdn.commento.io/js/commento.js"');
    });

});