describe("render", function () {

    const config = require('config');

    require('../../tests/util/setup')();

    it("will inject the script to take screenshots on preview domains", async function () {
        
        const res = await this.fetch(`${config.protocol}preview-of-blog-on-${this.blog.handle}.${config.host}?screenshot=true`);
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body.trim()).toContain('generateScreenshot');
    });

    it("will not inject the script to take screenshots on non-preview domains", async function () {
        
        const res = await this.fetch(`${config.protocol}${this.blog.handle}.${config.host}?screenshot=true`);
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body.trim()).not.toContain('generateScreenshot');
    });
});