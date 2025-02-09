describe("pluginHTML", function () {

    require('./util/setup')();

    // this is designed to prevent search engines from indexing the blog twice
    it("injects commento html", async function () {

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

    it("injects disqus html", async function () {

        // enable the commento plugin
        const shortname = 'test';
        const plugins = {...this.blog.plugins, disqus: {enabled: true, options: {shortname}}};
        await this.blog.update({plugins})

        await this.template({ "entry.html": "{{{entry.html}}} {{> pluginHTML}}" });
        await this.write({path: '/a.txt', content: 'Link: /foo\n\nHello, world!'});        

        const res = await this.get('/foo');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('<div id="disqus_thread"></div>');
        expect(body).toContain('disqus.com/embed.js');
        expect(body).toContain(`disqus_shortname = '${shortname}';`);
    });


    it("injects google analytics into appJS", async function () {

        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Google: true}, trackingID: 'UA-12345678-9'}}};
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('www.google-analytics.com/analytics.js');
        expect(body).toContain(`var GAID="${plugins.analytics.options.trackingID}"`);
    });

    it("injects clicky analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Clicky: true}, trackingID: '123456789'}}};
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('http://in.getclicky.com');
        expect(body).toContain(`clicky.init(${plugins.analytics.options.trackingID})`);
    });

    it("injects heap analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Heap: true}, trackingID: '123456789'}}}; 
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('heapanalytics.com');
        expect(body).toContain(`heap.load("${plugins.analytics.options.trackingID}")`);
    });

    it("injects simple analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {SimpleAnalytics: true}}}}; 
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('simpleanalyticscdn.com');
    });

    it("injects plausible analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Plausible: true}}}}; 
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('plausible.io/js/plausible.js');
    });

    it("injects fathom analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Fathom: true}, trackingID: '123456789'}}}; 
        await this.blog.update({plugins})

        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('cdn.usefathom.com');
        expect(body).toContain(`fathom("set","siteId","${plugins.analytics.options.trackingID}")`);
    });

    it("injects cloudflare analytics into appJS", async function () {
        
        const plugins = {...this.blog.plugins, analytics: {enabled: true, options: {provider: {Cloudflare: true}, trackingID: '123456789'}}};
        await this.blog.update({plugins})
        
        await this.template({ "script.js": "{{{appJS}}}" });

        const res = await this.get('/script.js');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('cloudflareinsights.com');
        expect(body).toContain(`"{'token': '${plugins.analytics.options.trackingID}'}`);

    }); 

    it("injects KaTeX CSS into appCSS", async function () {
        
        const plugins = {...this.blog.plugins, katex: {enabled: true}};
        await this.blog.update({plugins})

        await this.template({ "style.css": "{{{appCSS}}}" });

        const res = await this.get('/style.css');
        const body = await res.text();

        expect(res.status).toEqual(200);
        expect(body).toContain('.katex');
    });

    it("injects image zoom CSS and JS into appCSS and appJS", async function () {
        
        const plugins = {...this.blog.plugins, zoom: {enabled: true}};
        await this.blog.update({plugins})

        await this.template({ "style.css": "{{{appCSS}}}", "script.js": "{{{appJS}}}" });

        const resCSS = await this.get('/style.css');
        const bodyCSS = await resCSS.text();

        expect(resCSS.status).toEqual(200);
        expect(bodyCSS).toContain('.zoom-img');

        const resJS = await this.get('/script.js');
        const bodyJS = await resJS.text();

        expect(resJS.status).toEqual(200);
        expect(bodyJS).toContain('zoom-overlay');
    });

});