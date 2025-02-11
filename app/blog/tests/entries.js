describe("entries", function () {

    require('./util/setup')();

    it("lists the entries on an index page", async function () {

        await this.write({path: '/a.txt', content: 'Hello, A!'});
        await this.write({path: '/b.txt', content: 'Hello, B!'});
        await this.write({path: '/c.txt', content: 'Hello, C!'});

        await this.template({ "entries.html": "{{#entries}}{{{html}}}{{/entries}}" });

        const res = await this.get('/');

        expect(res.status).toEqual(200);
        const body = await res.text();
        expect(body).toContain('Hello, A!');
        expect(body).toContain('Hello, B!');
        expect(body).toContain('Hello, C!');
    });

    it("respects the page_size property in templates", async function () {

        await this.write({path: '/c.txt', content: 'Hello, C!'});
        await this.write({path: '/b.txt', content: 'Hello, B!'});
        await this.write({path: '/a.txt', content: 'Hello, A!'});

        await this.template({ "entries.html": "{{#entries}}{{{html}}}{{/entries}}" }, {
            locals: {page_size: 2}
        });

        const res = await this.get('/');

        expect(res.status).toEqual(200);
        const body = await res.text();
        expect(body).toContain('Hello, A!');
        expect(body).toContain('Hello, B!');
        expect(body).not.toContain('Hello, C!');

        const res2 = await this.get('/page/2');
        const body2 = await res2.text();
        expect(body2).not.toContain('Hello, A!');
        expect(body2).not.toContain('Hello, B!');
        expect(body2).toContain('Hello, C!');
    });

    it("generates pagination properly", async function () {

        const numberOfEntries = 10;
        const page_size = 3;

        // create 10 entries
        for (let i = numberOfEntries; i > 0; i--) {
            await this.write({path: `/${i}.txt`, content: `Hello, ${i}!`});
        }

        await this.template({ "entries.html": `
            {{#entries}}
            {{{html}}}
            {{/entries}}
            {{#pagination}}
                {{#next}}<a href="/page/{{next}}">Next</a>{{/next}}
                Page {{current}} of {{total}}
                {{#previous}}<a href="/page/{{previous}}">Prev</a>{{/previous}}
            {{/pagination}}
            `}, { locals: {page_size} });
        
        for (let i = 1; i <= 4; i++) {
            const res = await this.get(`/page/${i}`);
            const body = await res.text();
            expect(res.status).toEqual(200);
            expect(body).toContain('Page ' + i + ' of ' + Math.ceil(numberOfEntries / page_size));
            if (i === 4) {
                expect(body).not.toContain('Next');
                expect(body).toContain('Prev');
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 1}!`);
            } if (i === 1) {
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 1}!`);
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 2}!`);
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 3}!`);    
                expect(body).toContain('Next'); 
                expect(body).not.toContain('Prev');                
            } else {
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 1}!`);
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 2}!`);
                expect(body).toContain(`Hello, ${(i - 1) * 3 + 3}!`);    
                expect(body).toContain('Next');
                expect(body).toContain('Prev');
            }
        }
    });
});