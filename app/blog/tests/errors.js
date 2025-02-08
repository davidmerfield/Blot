describe("errors", function () {

    const config = require('config');

    require('./util/setup')();

    it("returns a nice error when the template does not exist", async function () {

        await this.blog.update({template: 'INVALID'})

        const res = await this.get('/');
        const body = await res.text();

        expect(res.status).toEqual(404);
        // todo: improve this error message
        expect(body).toContain('Cannot GET /');
    });

    it("returns a nice error when the template has an issue and the request is on a preview domain", async function () {

        await this.template({
            'entries.html': '{{#unclosed}}tag',
        });

        const res = await this.fetch(config.protocol + 'preview-of-my-local-on-' + this.blog.handle + '.' + config.host);
        const body = await res.text();

        expect(res.status).toEqual(500);
        // todo: improve this error message
        expect(body).toContain('Error with your template');
        expect(body).toContain('unclosed');

        const mainRes = await this.get('/');
        const mainBody = await mainRes.text();

        expect(mainRes.status).toEqual(500);
        expect(mainBody).not.toContain('unclosed');
    });

});